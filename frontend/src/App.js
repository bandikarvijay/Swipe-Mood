import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import CreateRoom from "./Pages/CreateRoom";

import Room from "./Pages/Room";

export default function App() {

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