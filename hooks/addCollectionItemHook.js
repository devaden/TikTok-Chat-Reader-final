const { getDocs,collection, addDoc } = require("firebase/firestore")
const config = require("../firebase/config")

module.exports = async (collectionName,data) => {
  const doc = collection(config.db,collectionName)
  addDoc(doc,data)
}