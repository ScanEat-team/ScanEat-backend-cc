// 📚 Handler User
// ---------------
const {
  register,
  login,
  forgotPassword,
  editUsers,
  deleteUsers,
  deleteAllUserData,
  getAllUsers,
  getUsers,
} = require("./handler/user");

// 📚 Handler Article
// --------------------
const {
  getAllArticles,
  getArticle,
  addArticle,
  updateArticle,
  deleteArticle,
} = require("./handler/artikeldata");

// 📚 Handler Makanan
// ---------------
const {getAllMakanan, getMakanan, getMakananById, addMakanan,updateMakanan, deleteAllMakanan} = require("./handler/makanan");

// 📚 Handler Predict
// -------------------
const { getPrediction, predict } = require("./handler/predict");
// const { predictAndSaveHistory, getHistoryHandler, deleteHistoryHandler } = require("./handler/predichisto");


// 📚 Handler lainnya
// -------------------
const { getAll, deleteAll } = require("./handler/alldata");

// 🚋 Routes Endpoint Server
// -------------------------
const routes = [
  // ---------------------------------------------------------
  // 🌐 Handler User
  // 🌐 Endpoint /register & /login & /forgotPassword & /users
  // ---------------------------------------------------------

  // ⚙️ POST /register
  // Untuk Register User
  {
    method: "POST",
    path: "/register",
    handler: register,
    // 👉 { name, email, password }
  },

  // ⚙️ POST /login
  // Untuk Login User
  {
    method: "POST",
    path: "/login",
    handler: login,
    // 👉 { email, password }
  },

  // ⚙️ POST /forgotPassword
  // Untuk Lupa Password User
  {
    method: "POST",
    path: "/forgotPassword",
    handler: forgotPassword,
    // 👉 { email }
  },

  // ⚙️ GET /users
  // users - Ambil Seluruh Data Users
  {
    method: "GET",
    path: "/users",
    handler: getAllUsers,
    // 👉 ""
  },

  // ⚙️ GET /users/{id}
  // users - Ambil Data Users Tertentu
  {
    method: "GET",
    path: "/users/{id}",
    handler: getUsers,
    // 👉 ""
  },

  // ⚙️ PUT /users/{id}
  // users - Edit Data Users Tertentu
  {
    method: "PUT",
    path: "/users/{id}",
    handler: editUsers,
    options: {
      payload: {
        maxBytes: 10485760,
        multipart: true,
        output: "stream",
      },
    },
    // 👉 ""
  },

  // ⚙️ DELETE /users/{id}
  // users - Hapus Data Users Tertentu
  {
    method: "DELETE",
    path: "/users/{id}",
    handler: deleteUsers,
    // 👉 ""
  },

  // ⚙️ DELETE /users/
  // users - Hapus Semua Data Users
  {
    method: "DELETE",
    path: "/users",
    handler: deleteAllUserData,
    // 👉 ""
  },

  // ---------------------
  // 🌐 Handler makanan
  // 🌐 Endpoint /makanan
  // ---------------------
  // ⚙️ GET /makanan
  // getAllArticles - Mengambil Semua Data Artikel dari Firestore
  {
    method: "GET",
    path: "/makanan",
    handler: getAllMakanan,
    // 👉 ""
  },
  // ⚙️ GET /makanan
  // getAllArticles - Mengambil Semua Data Artikel dari Firestore
  {
    method: "GET",
    path: "/makanan/{kategori}",
    handler: getMakanan,
    // 👉 ""
  },

  // ⚙️ GET /makanan/{id}
  // getArticle - Ambil Data makanan Tertentu
  {
    method: "GET",
    path: "/makanan/{kategori}/{makananId}",
    handler: getMakananById,
    // 👉 ""
  },

  // ⚙️ POST /makanan/
  // addArticle - Menyimpan Data makanan ke Firestore
  {
    method: "POST",
    path: "/makanan",
    handler: addMakanan,
    options: {
      payload: {
        maxBytes: 10485760,
        multipart: true,
        output: "stream",
      },
    },
    // 👉 ""
  },

  // ⚙️ PUT /makanan/{id}
  // updateArticle - Memperbarui Data makanan di Firestore
  {
    method: "PUT",
    path: "/makanan/{kategori}/{makananId}",
    handler: updateMakanan,
    options: {
      payload: {
        maxBytes: 10485760,
        multipart: true,
        output: "stream",
      },
    },
    // 👉 ""
  },

  // ⚙️ DELETE /makanan/
  // deleteArticle - Menghapus Data Artikel dari Firestore
  {
    method: "DELETE",
    path: "/makanan/{kategori}",
    handler: deleteAllMakanan,
    // 👉 ""
  },




  // ---------------------
  // 🌐 Handler Article
  // 🌐 Endpoint /article
  // ---------------------

  // ⚙️ GET /articles
  // getAllArticles - Mengambil Semua Data Artikel dari Firestore
  {
    method: "GET",
    path: "/articles",
    handler: getAllArticles,
    // 👉 ""
  },

  // ⚙️ GET /articles/{id}
  // getArticle - Ambil Data Artikel Tertentu
  {
    method: "GET",
    path: "/articles/{id}",
    handler: getArticle,
    // 👉 ""
  },

  // ⚙️ POST /articles/{id}
  // addArticle - Menyimpan Data Artikel ke Firestore
  {
    method: "POST",
    path: "/articles",
    handler: addArticle,
    options: {
      payload: {
        maxBytes: 10485760,
        multipart: true,
        output: "stream",
      },
    },
    // 👉 ""
  },

  // ⚙️ PUT /articles/{id}
  // updateArticle - Memperbarui Data Artikel di Firestore
  {
    method: "PUT",
    path: "/articles/{id}",
    handler: updateArticle,
    options: {
      payload: {
        maxBytes: 10485760,
        multipart: true,
        output: "stream",
      },
    },
    // 👉 ""
  },

  // ⚙️ DELETE /articles/{id}
  // deleteArticle - Menghapus Data Artikel dari Firestore
  {
    method: "DELETE",
    path: "/articles/{id}",
    handler: deleteArticle,
    // 👉 ""
  },


  // ----------------------
  // 🌐 Handler Database
  // 🌐 Endpoint /database
  // ----------------------

  // ⚙️ GET /database
  // all - Ambil Seluruh Data Database
  {
    method: "GET",
    path: "/database",
    handler: getAll,
    // 👉 ""
  },

  // ⚙️ DELETE /database
  // all - Hapus Seluruh Data Database
  {
    method: "DELETE",
    path: "/database",
    handler: deleteAll,
    // 👉 ""
  },

  // ---------------------
  // 🌐 Handler Predict
  // 🌐 Endpoint /predict
  // ---------------------

  // POST /predict
  // Membuat Prediksi
  {
    method: "POST",
    path: "/predict",
    handler: predict, // Menggunakan handler yang diperbarui
    options: {
        payload: {
            maxBytes: 10485760, // Batas ukuran file: 10 MB
            multipart: true, // Mendukung multipart/form-data
            output: "stream", // Mendukung streaming file
            parse: true, // Parsing otomatis untuk multipart payload
        },
    },
},
// {
//   method: "POST",
//   path: "/predicthisto",
//   handler: predictAndSaveHistory, // Menggunakan handler yang diperbarui
//   options: {
//       payload: {
//           maxBytes: 10485760, // Batas ukuran file: 10 MB
//           multipart: true, // Mendukung multipart/form-data
//           output: "stream", // Mendukung streaming file
//           parse: true, // Parsing otomatis untuk multipart payload
//       },
//   },
// },
// {
//   method: 'GET',
//   path: '/history/{user_id}', // Menggunakan parameter user_id dalam URL
//   handler: getHistoryHandler,
// },
// {
//   method: 'DELETE',
//   path: '/history/{history_id}', // Menggunakan parameter user_id dalam URL
//   handler: deleteHistoryHandler,
// },
// 📫 Export Routes ke Index
// -------------------------
];

module.exports = routes;
