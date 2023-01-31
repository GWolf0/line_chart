import LineChart from "./components/LineChart";
import data from "./data.js";

function App(){


  return (
    <div className="App" style={{width:'100vw',minHeight:'100vh',backgroundColor:'#212121'}}>
      <div className="innerContainer" style={{width:'100%',maxWidth:'1280px',padding:'2rem 0.5rem',margin:'0 auto'}}>
        <LineChart data={data} xValueOffs={4} />
      </div>
    </div>
  )
}

export default App;
