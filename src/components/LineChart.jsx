import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";

function LineChart({data,bgColor,chartBgColor,chartPadding,xValueOffs,xValueMaxLen,ySteps,textColor,colors}){
let can,cc;
let drawArea;
let maxYvalue;
let xValues;
let xStepSize;
let points=[];//points representing y values of each record of each line data
let compChartPadding;
//refs
const chartRef=useRef();
const canRef=useRef();
const valueIndicatorRef=useRef();
//states

//effects
useEffect(()=>{
    //console.log('LOG: effect');
    setupChart();
    drawChart();
    window.addEventListener('resize',onWindowResize);
    return ()=>{window.removeEventListener('resize',onWindowResize);}
},[]);

//methods
function onWindowResize(){
    //console.log("LOG: onresize");
    setupChart();
    drawChart();
}
function setupChart(){
    //console.log("LOG: setup ")
    //setup canvas
    can=canRef.current;
    cc=can.getContext('2d');
    can.width=chartRef.current.clientWidth;
    can.height=can.width*720/1280;
    //setup initial values
    compChartPadding=can.width*chartPadding/100;console.log('chart p',compChartPadding)
    maxYvalue=0;
    data.data.forEach((lineData,i)=>{
        lineData.data.forEach((record,j)=>{
            if(record.y>maxYvalue){
                maxYvalue=record.y;
            }
        });
    });
    xValues=new Set();
    data.data.forEach((lineData,i)=>{
        lineData.data.forEach((record,j)=>{//console.log(record.x)
            xValues.add(record.x.toString());
        });
    });
    xValues=Array.from(xValues).sort();console.log(xValues)
}
function drawChart(){
    //console.log("LOG: draw");
    //calculate draw area
    drawArea={x:compChartPadding,y:compChartPadding,w:can.width-compChartPadding,h:can.height-compChartPadding};
    //background
    cc.fillStyle=chartBgColor;
    cc.fillRect(0,0,can.width,can.height);
    //y axis
    drawLine({x:drawArea.x,y:drawArea.y},{x:drawArea.x,y:drawArea.h});
    //y axis steps
    const yAxisSize=drawArea.h-drawArea.y;
    const yStepSize=yAxisSize/ySteps;
    for(let y=0;y<ySteps+1;y++){
        let yPos=y*yStepSize+compChartPadding;
        drawLine({x:drawArea.x-5,y:yPos},{x:drawArea.x+5,y:yPos});
        drawText((pixelToYValue(yPos-compChartPadding)).toFixed(2),drawArea.x-compChartPadding*0.95,yPos);
    }
    //x axis
    drawLine({x:drawArea.x,y:drawArea.y},{x:drawArea.w,y:drawArea.y});
    //x axis steps
    const xSteps=xValues.length;
    const xAxisSize=drawArea.w-drawArea.x;
    xStepSize=xAxisSize/xSteps;
    for(let x=0;x<xSteps;x++){
        let xPos=(x+1)*xStepSize+compChartPadding;
        drawLine({x:xPos,y:drawArea.y-5},{x:xPos,y:drawArea.y+5});
        drawText(xValues[x].substr(xValueOffs,Math.min(xValueMaxLen,xValues[x].length)),xPos,drawArea.y-compChartPadding*0.25,textColor,true,25);
    }
    //chart lines
    drawChartLines();
}
function drawChartLines(){
    points.length=0;
    //let xValueIdx=0;
    data.data.forEach((lineData,i)=>{
        //console.log("in chart ",i)
        lineData.data.forEach((record,j)=>{
            //console.log("in rec ",xValueIdx)
            const yValue=record.y;
            const xValueIdx=xValues.indexOf(record.x.toString());//console.log('xidx',record.x,xValueIdx)
            const point={x:(xValueIdx+1)*xStepSize+compChartPadding,y:yValueToPixel(yValue)+compChartPadding,value:yValue,color:colors[i]};
            points.push(point);
            //console.log(point);
            const nextPoint=j+2>lineData.data.length?null:{x:(xValueIdx+2)*xStepSize+compChartPadding,y:yValueToPixel(lineData.data[j+1].y)+compChartPadding};
            const pointRadius=compChartPadding*0.1;
            drawCircle(point,pointRadius,colors[i]);
            if(nextPoint)drawLine(point,nextPoint,colors[i]);
            //xValueIdx++;
        });
    });
}
function drawPointerLine(localMousePos){
    drawChart();
    let snaped=null;
    const snapDistance=can.width*0.02;//console.log(snapDistance)
    for(let i=0;i<points.length;i++){
        const point=points[i];
        if(Math.abs(point.x-localMousePos.x)<snapDistance&&Math.abs(point.y-localMousePos.y)<snapDistance){
            localMousePos.x=point.x;
            localMousePos.y=point.y;
            snaped=point;
            break;
        }
    }
    drawLine({x:localMousePos.x,y:0},{x:localMousePos.x,y:can.height},textColor,true);
    if(snaped!=null){
        drawLine({x:0,y:snaped.y},{x:can.width,y:snaped.y},textColor,true);
        valueIndicatorRef.current.children[0].innerText=snaped.value;
        valueIndicatorRef.current.style.backgroundColor=snaped.color;
        valueIndicatorRef.current.style.left=`${snaped.x}px`;
        valueIndicatorRef.current.style.bottom=`${snaped.y}px`;
    }
}

//events
function onMouseMove(e){
    const mousePos={x:e.clientX,y:e.clientY};
    const canvasBR=can.getBoundingClientRect();
    const localMousePos={x:mousePos.x-canvasBR.x,y:flipY(mousePos.y-canvasBR.y)};
    drawPointerLine(localMousePos);
}

//helpers
function flipY(yval){
    return drawArea.h+drawArea.y-yval;
}
function pixelToYValue(px){//unit to pixel function
    return px*maxYvalue/(drawArea.h-drawArea.y);
}
function yValueToPixel(yval){//unit to pixel function
    return yval*(drawArea.h-drawArea.y)/maxYvalue;
}
function drawLine(from,to,color=textColor,dashed=false){
    cc.setLineDash(dashed?[5]:[]);
    cc.strokeStyle=color;
    cc.beginPath();
    cc.moveTo(from.x,flipY(from.y));
    cc.lineTo(to.x,flipY(to.y));
    cc.stroke();
    cc.closePath();
}
function drawCircle(center,radius,color=textColor){
    cc.fillStyle=color;
    cc.beginPath();
    cc.arc(center.x,flipY(center.y),radius,0,Math.PI*2);
    cc.fill();
    cc.closePath();
}
function drawText(txt,x,y,color=textColor,center=false,angle=0){
    cc.save();
    cc.font=`${Math.floor(compChartPadding*0.25)}px arial`;
    cc.fillStyle=color;
    const textWidth=cc.measureText(txt).width;
    let xpos=center?x-textWidth*0.5:x;
    cc.translate(xpos,flipY(y));
    cc.rotate(angle*Math.PI/180);
    cc.fillText(txt,0,0);
    cc.restore();
}


return(
<div ref={chartRef} className="lineChart" style={{height:'fit-content',backgroundColor:bgColor,display:'grid',gridTemplateRows:'60px auto 60px',border:'1px solid rgba(0,0,0,0.25)',borderRadius:'4px',overflow:'hidden'}}>
    <section className="lineChartHeader" style={{borderBottom:'1px solid rgba(0,0,0,0.25)',display:'flex',flexDirection:'row',alignItems:'center',padding:'0 0.5rem'}}>
        <p style={{color:textColor,fontSize:'1.2rem',fontWeight:'bold'}}>{data.title}</p>
    </section>
    <section className="lineChartBody" style={{position:'relative',aspectRatio:'2',backgroundColor:chartBgColor}}>
        <canvas id="can" ref={canRef} onMouseMove={onMouseMove}></canvas>
        <div ref={valueIndicatorRef} className="valueIndicator" style={{position:'absolute',left:`-1000px`,bottom:`-1000px`,padding:'0.25rem 0.5rem',backgroundColor:bgColor,borderRadius:'2px'}}>
            <p style={{color:'#eee',textAlign:'center',fontSize:'0.75rem'}}>test</p>
        </div>
    </section>
    <section className="lineChartFooter" style={{borderTop:'1px solid rgba(0,0,0,0.25)',display:'flex',flexDirection:'row',alignItems:'center',padding:'0 0.5rem'}}>
        {
            data.data.map((lineData,i)=>(
                <div key={i} style={{height:'40px',display:'flex',flexDirection:'row',alignItems:'center',marginRight:'0.5rem'}}><span style={{width:'1.5rem',height:'1.5rem',backgroundColor:colors[i],borderRadius:'4px'}}></span><p style={{display:'inline-block',fontSize:'0.85rem',color:textColor,marginLeft:'0.25rem'}}>{lineData.label}</p></div>
            ))
        }
    </section>
</div>
);

}

LineChart.defaultProps={
    colors:["cornflowerblue","crimson","magenta","yellow","lime"],
    bgColor:'#ddd',
    chartBgColor:'#fff',
    textColor:'#333',
    chartPadding:5,
    xValueOffs:0,
    xValueMaxLen:6,
    ySteps:5
};

export default LineChart;
