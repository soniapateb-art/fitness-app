import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadExercises(data.session.user.email);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadExercises(session.user.email);
      else setExercises([]);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = session?.user?.email === "admin@email.com";

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function loadExercises(userEmail) {
    let query = supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: false });

    if (userEmail !== "admin@email.com") {
      query = query.eq("client_email", userEmail);
    }

    const { data, error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setExercises(data || []);
  }

  async function addExercise() {
    if (!clientEmail || !title || !videoUrl) {
      alert("Please add client email, exercise title and video URL");
      return;
    }

    const { error } = await supabase.from("exercises").insert([
      {
        client_email: clientEmail,
        title,
        video_url: videoUrl,
        notes,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setVideoUrl("");
    setNotes("");
    loadExercises(session.user.email);
  }

  async function deleteExercise(id) {
    const { error } = await supabase.from("exercises").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadExercises(session.user.email);
  }

  if (!session) {
    return (
      <div style={{ padding: 30, fontFamily: "Arial", maxWidth: 500, margin: "0 auto" }}>
        <h1>Fitness App Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, width: "100%", marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 12, width: "100%", marginBottom: 10 }}
        />

        <button onClick={login} style={{ padding: 12, width: "100%" }}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, fontFamily: "Arial", maxWidth: 900, margin: "0 auto" }}>
      <h1>My Fitness App</h1>

      <p>
        Logged in as: <b>{session.user.email}</b>
      </p>

      <button onClick={logout} style={{ padding: 10 }}>
        Logout
      </button>

      {isAdmin && (
        <>
          <hr />

          <h2>Add Exercise For Client</h2>

          <input
            placeholder="Client Email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            style={{ padding: 12, width: "100%", marginBottom: 10 }}
          />

          <input
            placeholder="Exercise Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 12, width: "100%", marginBottom: 10 }}
          />

          <input
            placeholder="Supabase Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            style={{ padding: 12, width: "100%", marginBottom: 10 }}
          />

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ padding: 12, width: "100%", height: 90, marginBottom: 10 }}
          />

          <button onClick={addExercise} style={{ padding: 12 }}>
            Add Exercise
          </button>
        </>
      )}

      <hr />

      <h2>{isAdmin ? "All Client Exercises" : "My Exercises"}</h2>

      {exercises.length === 0 && <p>No exercises yet.</p>}

      {exercises.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 20,
            borderRadius: 8,
          }}
        >
          <h3>{item.title}</h3>

          <p>
            <b>Client:</b> {item.client_email}
          </p>

          <p>{item.notes}</p>

          <video
            src={item.video_url}
            controls
            playsInline
            style={{
              width: "100%",
              maxWidth: 500,
              borderRadius: 8,
              background: "black",
            }}
          />

          {isAdmin && (
            <>
              <br />
              <button
                onClick={() => deleteExercise(item.id)}
                style={{
                  padding: 10,
                  background: "red",
                  color: "white",
                  border: "none",
                  marginTop: 10,
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}