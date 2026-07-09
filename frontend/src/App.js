import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import CreateRoom from "./Pages/CreateRoom";
import Room from "./Pages/Room";

export default function App() {

  // Change to false tomorrow
  const maintenance = true;

  if (maintenance) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          background: "#0b1020",
          color: "#fff",
          fontFamily: "Arial",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h1>🚧 No more SwipeMood </h1>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<CreateRoom />}
        />

        <Route
          path="/room/:roomCode"
          element={<Room />}
        />

      </Routes>
    </BrowserRouter>
  );
}
