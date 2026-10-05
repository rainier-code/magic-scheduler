import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import History from "./pages/History";
import Settings from "./pages/Settings";

function App() {
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`);

        setEvents(response.data);
      } catch (error) {
        console.error(
          "Failed to load events:",
          error
        );
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const addEvent = (newEvent) => {
    setEvents((currentEvents) => [
      ...currentEvents,
      newEvent,
    ]);
  };

  const updateEvent = (updatedEvent) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event._id === updatedEvent._id
          ? updatedEvent
          : event
      )
    );
  };

  const deleteEvent = (eventId) => {
    setEvents((currentEvents) =>
      currentEvents.filter(
        (event) => event._id !== eventId
      )
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              events={events}
              isLoadingEvents={isLoadingEvents}
              onAddEvent={addEvent}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
            />
          }
        />

        <Route
          path="/calendar"
          element={
            <Calendar
              events={events}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
            />
          }
        />

        <Route
          path="/clients"
          element={
            <Clients
              events={events}
              onUpdateEvent={updateEvent}
              onDeleteEvent={deleteEvent}
            />
          }
        />

        <Route
          path="/history"
          element={
            <History
              events={events}
            />
          }
        />

        <Route
          path="/settings"
          element={
            <Settings />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
