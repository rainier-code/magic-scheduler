import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { getApiErrorMessage } from "./utils/apiErrors";

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsLoadError, setEventsLoadError] = useState("");


  const fetchEvents = useCallback(async () => {
    const maxAttempts = 3;
    let lastError;

    setIsLoadingEvents(true);
    setEventsLoadError("");

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/events`,
            { timeout: 15000 }
          );

          setEvents(Array.isArray(response.data) ? response.data : []);
          setEventsLoadError("");
          return;
        } catch (error) {
          lastError = error;

          console.error(
            `Failed to load events (attempt ${attempt}/${maxAttempts}):`,
            error?.code || error?.name || "RequestError"
          );

          if (attempt < maxAttempts) {
            await delay(2000);
          }
        }
      }

      setEventsLoadError(
        getApiErrorMessage(
          lastError,
          "Could not load your event records."
        )
      );
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
      <NotificationProvider events={events}>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                events={events}
                isLoadingEvents={isLoadingEvents}
                eventsLoadError={eventsLoadError}
                onRetryLoad={fetchEvents}
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
                eventsLoadError={eventsLoadError}
                onRetryLoad={fetchEvents}
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
                eventsLoadError={eventsLoadError}
                onRetryLoad={fetchEvents}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
              />
            }
          />

          <Route path="/history" element={<History events={events} eventsLoadError={eventsLoadError} onRetryLoad={fetchEvents} />} />
          <Route
            path="/settings"
            element={
              <Settings eventsLoadError={eventsLoadError} onRetryLoad={fetchEvents} />
            }
          />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
