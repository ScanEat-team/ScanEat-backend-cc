// 📚 Library
// -----------
const firebase_admin = require("firebase-admin");
const api_key = require("../private/key.json").api_key;
const { Storage } = require("@google-cloud/storage");
const bucketName = require("../private/key.json").storage_bucket;
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

// 📫 POST /register
// -----------------
const register = async (request, h) => {
  try {
    // ⚙️ Ambil Request Payload
    const apiKey = request.headers["x-api-key"];
    const { name, email, password, sex, birthdate, weight, height, dietPreference } = request.payload;

    // 🔑 API KEY Check
    if (apiKey !== api_key) {
      return h
        .response({
          status: "unauthorized",
          message: "Invalid API key",
        })
        .code(401);
    }

    // ⚙️ Validasi input wajib
    if (!name || !email || !password || !birthdate || !weight || !height) {
      return h
        .response({
          status: "fail",
          message: "Missing required fields (name, email, password, birthdate, weight, height)",
        })
        .code(400);
    }

    // ⚙️ Hitung umur berdasarkan birthdate
    const birthDateObject = new Date(birthdate);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - birthDateObject.getFullYear();

    // ⚙️ Hitung BMI berdasarkan weight (kg) dan height (cm)
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters ** 2);

    // ⚙️ Hash password
    const hashedPassword = await bcrypt.hash(password, 5);

    // ⚙️ Buat user di Firebase Authentication
    const userRecord = await firebase_admin.auth().createUser({
      email: email,
      password: hashedPassword,
    });

    // ⚙️ Inisialisasi Firestore
    const db = firebase_admin.firestore();
    const outputDb = db.collection("users");
    const newDocumentRef = outputDb.doc();
    const documentId = newDocumentRef.id;

    // ⚙️ Tambahkan user ke Firestore
    await newDocumentRef.set({
      user_id: documentId,
      firebase_uid: userRecord.uid,
      name,
      email,
      password: hashedPassword,
      sex,
      birthdate,
      age,
      weight,
      height,
      bmi,
      dietPreference: dietPreference || "Not Specified", // Default jika tidak ada input
    });

    // 📥 Response
    return h.response({
      status: "success",
      message: "Register Success",
      data: {
        user_id: documentId,
        firebase_uid: userRecord.uid,
        name,
        email,
        sex,
        birthdate,
        age,
        weight,
        height,
        bmi,
        dietPreference: dietPreference || "Not Specified",
      },
    }).code(201);

  } catch (error) {
    // 🖨️ Print Error
    console.error("Error creating user:", error);

    // 📥 Response Error
    const response = {
      status: "error",
      message: "Register Failed",
    };

    // ⚙️ Check if the error is due to an existing email
    if (error.code === "auth/email-already-exists") {
      response.message = "Email address is already in use";
    }

    return h.response(response).code(400);
  }
};


// 📫 POST /login
// ---------------
const login = async (request, h) => {
  try {
    // ⚙️ Ambil API Key dan Request Payload
    const apiKey = request.headers["x-api-key"];
    const { email, password } = request.payload;

    // 🔑 Validasi API Key
    if (apiKey !== api_key) {
      return h
        .response({
          status: "unauthorized",
          message: "Invalid API key",
        })
        .code(401);
    }

    // ⚙️ Query User berdasarkan email di Firestore
    const userQuery = await firebase_admin
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .get();

    // ⚙️ Jika User Tidak Ditemukan
    if (userQuery.empty) {
      return h.response({
        error: true,
        message: "User not found",
      }).code(404);
    }

    // ⚙️ Ambil Data User
    const userData = userQuery.docs[0].data();

    // ⚙️ Validasi Data User
    if (!userData || !userData.password || !userData.firebase_uid) {
      return h.response({
        error: true,
        message: "Invalid user data",
      }).code(400);
    }

    // ⚙️ Perbandingkan Password yang Diberikan dengan yang Terenkripsi
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return h.response({
        error: true,
        message: "Password incorrect",
      }).code(401);
    }

    // ⚙️ Format Respons dengan Semua Data User
    const responseData = {
      error: false,
      message: "Login Success",
      user: {
        user_id: userData.user_id,
        firebase_uid: userData.firebase_uid,
        name: userData.name,
        email: userData.email,
        sex: userData.sex || null,
        birthdate: userData.birthdate || null,
        age: userData.age || null,
        weight: userData.weight || null,
        height: userData.height || null,
        bmi: userData.bmi || null,
        dietPreference: userData.dietPreference || null,
      },
    };

    return h.response(responseData).code(200);
  } catch (error) {
    // 🖨️ Cetak Error
    console.error("Error logging in:", error);

    return h.response({
      error: true,
      message: "Login Failed",
    }).code(500);
  }
};


// 📫 POST /forgotPassword
// -----------------------
const forgotPassword = async (request, h) => {
  // ⚠️ Try
  // -------
  try {
    // ⚙️ Ambil Request Payload
    const apiKey = request.headers["x-api-key"];
    const { email } = request.payload;

    // 🔑 API KEY Check
    if (apiKey !== api_key) {
      return h
        .response({
          status: "unauthorized",
          message: "Invalid API key",
        })
        .code(401);
    }

    // ⚙️ Check if the user with the provided email exists
    const userRecord = await firebase_admin.auth().getUserByEmail(email);

    // ⚙️ Generate a password reset link
    const resetLink = await firebase_admin
      .auth()
      .generatePasswordResetLink(email);

    // 📥 Placeholder response
    const response = h
      .response({
        error: false,
        message: "Password reset link sent to the user's email",
        resetlink: resetLink,
      })
      .code(200);

    // 📥 Response
    return response;

    // ⚠️ Catch
    // ---------
  } catch (error) {
    // 🖨️ Print Error
    console.error("Error in forgotPassword:", error);

    // 📥 Response
    const response = h
      .response({
        error: true,
        message: "Forgot Password Failed",
      })
      .code(500); // Internal Server Error

    // 📥 Response
    return response;
  }
};


// editUsers - Edit Data Users
const editUsers = async (request, h) => {
  const key = request.headers["x-api-key"];

  // Jika Kunci API Salah
  if (key !== api_key) {
    return h.response({
      status: "unauthorized",
      message: "Invalid API key",
    }).code(401);
  }

  try {
    // Ambil data dari request payload
    const { userId, name, sex, birthdate, weight, height, dietPreference } = request.payload;

    // Validasi userId
    if (!userId || typeof userId !== "string") {
      return h.response({
        status: "bad request",
        message: "Invalid or missing userId in the payload.",
      }).code(400);
    }

    // Ambil referensi Firestore untuk pengguna yang akan diperbarui
    const db = firebase_admin.firestore();
    const userRef = db.collection("users").doc(userId);

    // Periksa apakah user ada
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      return h.response({
        status: "not found",
        message: "User not found",
      }).code(404);
    }

    // Siapkan data untuk diperbarui
    const updateData = {};

    if (name) updateData.name = name;
    if (sex) updateData.sex = sex;
    if (birthdate) {
      const birthDateObject = new Date(birthdate);
      const currentDate = new Date();
      const age = currentDate.getFullYear() - birthDateObject.getFullYear();
      updateData.birthdate = birthdate;
      updateData.age = age;
    }
    if (weight) updateData.weight = weight;
    if (height) {
      updateData.height = height;
      if (weight) {
        // Perbarui BMI jika height dan weight tersedia
        const heightInMeters = height / 100;
        updateData.bmi = weight / (heightInMeters ** 2);
      }
    }
    if (dietPreference) updateData.dietPreference = dietPreference;

    // Update Firestore dengan data yang diperbarui
    await userRef.update(updateData);

    return h.response({
      status: "success",
      message: "User updated successfully",
      data: updateData,
    }).code(200);
  } catch (error) {
    console.error("Error editing user:", error);

    return h.response({
      status: "error",
      message: "Failed to update user data",
    }).code(500);
  }
};


// users - Hapus Data Users Tertentu
const deleteUsers = async (request, h) => {
  // Mengambil Kunci API dari Request Header
  const key = request.headers["x-api-key"];
  // Jika Kunci API Benar
  if (key === api_key) {
      const { id } = request.params;

      try {
          const db = firebase_admin.firestore();
          const outputDb = db.collection("users");

          // Get the user document to obtain the user_picture URL and firebase_uid
          const userDoc = await outputDb.doc(id).get();

          // Check if the user exists
          if (!userDoc.exists) {
              const response = h.response({
                  status: "not found",
                  message: "User not found",
              });
              response.code(404); // Not Found
              return response;
          }

          // Delete user document from Firestore
          await outputDb.doc(id).delete();

          // Delete user's photo from cloud storage
          const user_picture_url = userDoc.data().user_picture;
          if (user_picture_url) {
              try {
                  const filename = user_picture_url.split('/').pop(); // Extract filename from URL
                  const storage = new Storage({
                      keyFilename: path.join(__dirname, "../private/gcloud.json"),
                  });

                  // Delete the file from cloud storage
                  await storage.bucket(bucketName).file(`users/${filename}`).delete();
              } catch (storageError) {
                  console.error("Error deleting user photo from cloud storage:", storageError);
                  // Log the error and continue, since it's not critical for the overall operation
              }
          }

          // Delete user from Firebase Authentication
          const firebaseUid = userDoc.data().firebase_uid;
          await firebase_admin.auth().deleteUser(firebaseUid);

          const response = h.response({
              status: "success",
          });
          response.code(200);
          return response;
      } catch (error) {
          console.error("Error deleting user:", error);

          const response = h.response({
              status: "bad request",
              message: "Error deleting user",
          });
          response.code(500); // Internal Server Error
          return response;
      }
  }
  // Jika Kunci API Salah
  else {
      const response = h.response({
          status: "unauthorized",
      });
      response.code(401);
      return response;
  }
};

const deleteAllUserData = async () => {
  try {
      const db = firebase_admin.firestore();
      const outputDb = db.collection("users");

      // Get all documents in the "users" collection
      const snapshot = await outputDb.get();

      // Array to store all promises for parallel execution
      const deletePromises = [];

      // Loop through each document and delete user data
      snapshot.forEach(async (doc) => {
          const userId = doc.id;

          // Delete user document from Firestore
          const deleteDocPromise = outputDb.doc(userId).delete();
          deletePromises.push(deleteDocPromise);

          // Delete user's photo from Cloud Storage
          const user_picture_url = doc.data().user_picture;
          if (user_picture_url) {
              const filename = user_picture_url.split('/').pop();
              const storage = new Storage({
                  keyFilename: path.join(__dirname, "../private/gcloud.json"),
              });

              // Delete the file from Cloud Storage
              const deleteStoragePromise = storage.bucket(bucketName).file(`users/${filename}`).delete();
              deletePromises.push(deleteStoragePromise);
          }

          // Delete user from Firebase Authentication
          const firebaseUid = doc.data().firebase_uid;
          const deleteUserPromise = firebase_admin.auth().deleteUser(firebaseUid);
          deletePromises.push(deleteUserPromise);

          console.log(`User data for ${userId} marked for deletion`);
      });

      // Wait for all promises to resolve
      await Promise.all(deletePromises);

      console.log("All user data deleted successfully");
      return "success"; // Return a value or use return Promise.resolve("success");
  } catch (error) {
      console.error("Error deleting all user data:", error);
      throw error; // Throw an error to fulfill Hapi's expectations
  }
};

// users - Ambil Seluruh Data Users
const getAllUsers = async (request, h) => {
  // Mengambil Kunci API dari Request Header
  const key = request.headers["x-api-key"];
  // Jika Kunci API Benar
  if (key === api_key) {
      const db = firebase_admin.firestore();
      const responseData = {};
      responseData["users"] = [];
      const outputDb = await db.collection("users");
      const snapshot = await outputDb.get();

      snapshot.forEach((doc) => {
          const dataObject = {};
          dataObject[doc.id] = doc.data();
          responseData["users"].push(dataObject);
      });

      const response = h.response(responseData);
      response.code(200);
      return response;
  }
  // Jika Kunci API Salah
  else {
      const response = h.response({
          status: "unauthorized",
      });
      response.code(401);
      return response;
  }
};

// users - Ambil Data Users Tertentu
const getUsers = async (request, h) => {
  // Mengambil Kunci API dari Request Header
  const key = request.headers["x-api-key"];
  // Jika Kunci API Benar
  if (key === api_key) {
      // Mengambil ID Users dari Request Params
      const { id } = request.params;
      const responseData = {};

      const db = firebase_admin.firestore();
      responseData[id] = (await db.collection("users").doc(id).get()).data();

      const response = h.response(responseData);
      response.code(200);
      return response;
  }
  // Jika Kunci API Salah
  else {
      const response = h.response({
          status: "unauthorized",
      });
      response.code(401);
      return response;
  }
};

// 📫 Export Routes
// -----------------
module.exports = { register, login, forgotPassword,editUsers, deleteUsers, deleteAllUserData, getAllUsers, getUsers };
