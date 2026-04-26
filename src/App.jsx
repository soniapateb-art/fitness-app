import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const adminEmail = "admin@email.com";

  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [exercises, setExercises] = useState([]);
  const [checkins, setCheckins] = useState([]);

  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [restTime, setRestTime] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [weight, setWeight] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [wins, setWins] = useState("");
  const [Challenges This Week, setChallenges This Week] = useState("");
  const [checkinNotes, setCheckinNotes] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadExercises(data.session.user.email);
        loadCheckins(data.session.user.email);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);

        if (currentSession) {
          loadExercises(currentSession.user.email);
          loadCheckins(currentSession.user.email);
        } else {
          setExercises([]);
          setCheckins([]);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = session?.user?.email === adminEmail;

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

    if (userEmail !== adminEmail) {
      query = query.eq("client_email", userEmail);
    }

    const { data, error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setExercises(data || []);
  }

  async function loadCheckins(userEmail) {
    let query = supabase
      .from("checkins")
      .select("*")
      .order("created_at", { ascending: false });

    if (userEmail !== adminEmail) {
      query = query.eq("client_email", userEmail);
    }

    const { data, error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setCheckins(data || []);
  }

  function clearExerciseForm() {
    setClientEmail("");
    setTitle("");
    setVideoUrl("");
    setExerciseNotes("");
    setSets("");
    setReps("");
    setRestTime("");
    setCategory("");
    setEditingId(null);
  }

  async function saveExercise() {
    if (!clientEmail || !title || !videoUrl) {
      alert("Please add client email, title and video URL");
      return;
    }

    const exerciseData = {
      client_email: clientEmail,
      title,
      video_url: videoUrl,
      notes: exerciseNotes,
      sets,
      reps,
      rest_time: restTime,
      category,
    };

    const result = editingId
      ? await supabase.from("exercises").update(exerciseData).eq("id", editingId)
      : await supabase.from("exercises").insert([exerciseData]);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    clearExerciseForm();
    loadExercises(session.user.email);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setClientEmail(item.client_email || "");
    setTitle(item.title || "");
    setVideoUrl(item.video_url || "");
    setExerciseNotes(item.notes || "");
    setSets(item.sets || "");
    setReps(item.reps || "");
    setRestTime(item.rest_time || "");
    setCategory(item.category || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteExercise(id) {
    await supabase.from("exercises").delete().eq("id", id);
    loadExercises(session.user.email);
  }

  async function markComplete(id, current) {
    await supabase.from("exercises").update({ completed: !current }).eq("id", id);
    loadExercises(session.user.email);
  }

  async function submitCheckin() {
    const { error } = await supabase.from("checkins").insert([
      {
        client_email: session.user.email,
        weight,
        mood,
        energy,
        wins,
        Challenges This Week,
        notes: checkinNotes,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setWeight("");
    setMood("");
    setEnergy("");
    setWins("");
    setChallenges This Week("");
    setCheckinNotes("");

    loadCheckins(session.user.email);
  }

  async function deleteCheckin(id) {
    await supabase.from("checkins").delete().eq("id", id);
    loadCheckins(session.user.email);
  }

  const inputStyle = {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #444",
    background: "#222",
    color: "white",
  };

  const cardStyle = {
    background: "#1e1e1e",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  };

  const buttonStyle = {
    padding: 12,
    borderRadius: 8,
    border: "none",
    marginRight: 8,
    marginTop: 8,
    cursor: "pointer",
  };

  if (!session) {
    return (
      <div style={{ padding: 40, background: "#111", color: "white", minHeight: "100vh" }}>
        <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
          <img src="/logo.png.png" style={{ width: 180, marginBottom: 20 }} />
          <h1>Client Login</h1>

          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <button onClick={login} style={{ ...buttonStyle, width: "100%" }}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, background: "#111", color: "white", minHeight: "100vh", fontFamily: "Arial" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <img src="/logo.png.png" style={{ width: 180 }} />
          <h1>{isAdmin ? "Coach Dashboard" : "My Training Plan"}</h1>
          <p>{session.user.email}</p>
          <button onClick={logout} style={buttonStyle}>Logout</button>
        </div>

        {isAdmin && (
          <div style={cardStyle}>
            <h2>{editingId ? "Edit Exercise" : "Add Client Exercise"}</h2>

            <input placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Exercise Title" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <input placeholder="Supabase Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={inputStyle} />
            <input placeholder="Sets" value={sets} onChange={(e) => setSets(e.target.value)} style={inputStyle} />
            <input placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} style={inputStyle} />
            <input placeholder="Rest Time" value={restTime} onChange={(e) => setRestTime(e.target.value)} style={inputStyle} />
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />

            <textarea placeholder="Exercise Notes" value={exerciseNotes} onChange={(e) => setExerciseNotes(e.target.value)} style={{ ...inputStyle, height: 100 }} />

            <button onClick={saveExercise} style={{ ...buttonStyle, background: "white", color: "black" }}>
              {editingId ? "Save Changes" : "Add Exercise"}
            </button>

            {editingId && (
              <button onClick={clearExerciseForm} style={{ ...buttonStyle, background: "#555", color: "white" }}>
                Cancel Edit
              </button>
            )}
          </div>
        )}

        <h2>Workouts</h2>

        {exercises.map((item) => (
          <div key={item.id} style={cardStyle}>
            <h3>{item.title}</h3>

            {isAdmin && <p><b>Client:</b> {item.client_email}</p>}

            <p><b>Category:</b> {item.category}</p>
            <p><b>Sets:</b> {item.sets}</p>
            <p><b>Reps:</b> {item.reps}</p>
            <p><b>Rest:</b> {item.rest_time}</p>
            <p>{item.notes}</p>

            <video
              src={item.video_url}
              controls
              playsInline
              style={{ width: "100%", maxWidth: 500, borderRadius: 10 }}
            />

            <br />

            {!isAdmin && (
              <button onClick={() => markComplete(item.id, item.completed)} style={buttonStyle}>
                {item.completed ? "Completed ✅" : "Mark Complete"}
              </button>
            )}

            {isAdmin && (
              <>
                <button onClick={() => startEdit(item)} style={{ ...buttonStyle, background: "#f1c40f" }}>
                  Edit
                </button>

                <button onClick={() => deleteExercise(item.id)} style={{ ...buttonStyle, background: "red", color: "white" }}>
                  Delete
                </button>
              </>
            )}
          </div>
        ))}

        {!isAdmin && (
          <div style={cardStyle}>
            <h2>Weekly Check-In</h2>

            <input placeholder="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />
            <input placeholder="Mindset This Week" value={mood} onChange={(e) => setMood(e.target.value)} style={inputStyle} />
            <input placeholder="Energy Levels" value={energy} onChange={(e) => setEnergy(e.target.value)} style={inputStyle} />

            <textarea placeholder="Progress This Week" value={wins} onChange={(e) => setWins(e.target.value)} style={{ ...inputStyle, height: 80 }} />
            <textarea placeholder="Challenges This Week" value={Challenges This Week} onChange={(e) => setChallenges This Week(e.target.value)} style={{ ...inputStyle, height: 80 }} />
            <textarea placeholder="Anything You Need Help With?" value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} style={{ ...inputStyle, height: 80 }} />

            <button onClick={submitCheckin} style={{ ...buttonStyle, background: "white", color: "black" }}>
              Submit Check-In
            </button>
          </div>
        )}

        <h2>{isAdmin ? "Client Check-Ins" : "My Check-Ins"}</h2>

        {checkins.map((item) => (
          <div key={item.id} style={cardStyle}>
            <p><b>Client:</b> {item.client_email}</p>
            <p><b>Weight:</b> {item.weight}</p>
            <p><b>Mood:</b> {item.mood}</p>
            <p><b>Energy:</b> {item.energy}</p>
            <p><b>Wins:</b> {item.wins}</p>
            <p><b>Challenges This Week:</b> {item.Challenges This Week}</p>
            <p><b>Notes:</b> {item.notes}</p>

            {isAdmin && (
              <button onClick={() => deleteCheckin(item.id)} style={{ ...buttonStyle, background: "red", color: "white" }}>
                Delete Check-In
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}