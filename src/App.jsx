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
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [restTime, setRestTime] = useState("");
  const [category, setCategory] = useState("");

  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadExercises(data.session.user.email);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) loadExercises(session.user.email);
        else setExercises([]);
      }
    );

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

    if (!error) setExercises(data || []);
  }

  async function addExercise() {
    const { error } = await supabase.from("exercises").insert([
      {
        client_email: clientEmail,
        title,
        video_url: videoUrl,
        notes,
        sets,
        reps,
        rest_time: restTime,
        category,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setClientEmail("");
    setTitle("");
    setVideoUrl("");
    setNotes("");
    setSets("");
    setReps("");
    setRestTime("");
    setCategory("");

    loadExercises(session.user.email);
  }

  async function deleteExercise(id) {
    await supabase.from("exercises").delete().eq("id", id);
    loadExercises(session.user.email);
  }

  async function markComplete(id, current) {
    await supabase
      .from("exercises")
      .update({ completed: !current })
      .eq("id", id);

    loadExercises(session.user.email);
  }

  if (!session) {
    return (
      <div style={{ padding: 40, color: "white", background: "#111", minHeight: "100vh" }}>
        <h1>Login</h1>

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
    <div
      style={{
        padding: 30,
        background: "#111",
        color: "white",
        minHeight: "100vh",
        fontFamily: "Arial",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png.png" style={{ width: 180 }} />
        <h1>Premium Fitness</h1>
        <p>{session.user.email}</p>
        <button onClick={logout}>Logout</button>
      </div>

      {isAdmin && (
        <>
          <hr />
          <h2>Add Client Exercise</h2>

          <input placeholder="Client Email" value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)} />

          <input placeholder="Title" value={title}
            onChange={(e) => setTitle(e.target.value)} />

          <input placeholder="Video URL" value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)} />

          <input placeholder="Sets" value={sets}
            onChange={(e) => setSets(e.target.value)} />

          <input placeholder="Reps" value={reps}
            onChange={(e) => setReps(e.target.value)} />

          <input placeholder="Rest Time" value={restTime}
            onChange={(e) => setRestTime(e.target.value)} />

          <input placeholder="Category" value={category}
            onChange={(e) => setCategory(e.target.value)} />

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <br /><br />
          <button onClick={addExercise}>Add Exercise</button>
        </>
      )}

      <hr />

      <h2>{isAdmin ? "All Client Workouts" : "My Workouts"}</h2>

      {exercises.map((item) => (
        <div
          key={item.id}
          style={{
            background: "#1e1e1e",
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <h3>{item.title}</h3>
          <p><b>Client:</b> {item.client_email}</p>
          <p><b>Category:</b> {item.category}</p>
          <p><b>Sets:</b> {item.sets} | <b>Reps:</b> {item.reps}</p>
          <p><b>Rest:</b> {item.rest_time}</p>
          <p>{item.notes}</p>

          <video
            src={item.video_url}
            controls
            style={{ width: "100%", maxWidth: 500, borderRadius: 10 }}
          />

          <br /><br />

          {!isAdmin && (
            <button onClick={() => markComplete(item.id, item.completed)}>
              {item.completed ? "Completed ✅" : "Mark Complete"}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => deleteExercise(item.id)}
              style={{ background: "red", color: "white" }}
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}