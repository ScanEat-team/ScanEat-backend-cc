// 📚 Library
// ----------
const Hapi = require("@hapi/hapi");
const routes = require("./routes.js");
const firebase_admin = require("firebase-admin");
const serviceAccount = require("./private/firebase.json");

// 🔥 Function - Inisialiasi Firebase
// -----------------------------------
const firebase_init = () => {
  // Cek apakah Firebase sudah diinisialisasi
  if (!firebase_admin.apps.length) {
    firebase_admin.initializeApp({
      credential: firebase_admin.credential.cert(serviceAccount),
    });
    console.log("Firebase berhasil diinisialisasi.");
  } else {
    console.log("Firebase sudah diinisialisasi sebelumnya.");
  }
};

// 🐕‍🦺 Function - Server HAPI
// -------------------------
const init = async () => {
  // ⚙️ Server dan Port
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ['*'], // Mengizinkan semua origin. Ganti '*' dengan domain tertentu jika diperlukan.
        credentials: true, // Mengizinkan kredensial seperti cookie
      }
    }
  });

  // ⚙️ Routes
  server.route(routes);

  // Start server
  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

// 💻 Eksekusi Firebase dan Server
// -------------------------------
firebase_init();
init();
