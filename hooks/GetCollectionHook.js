const { getDocs,collection } = require("firebase/firestore")
const config = require("../firebase/config.js")

module.exports = async (collectionName) => {
    const Col = collection(config.db,collectionName)
  const Snapshot = await  getDocs(Col)
  const docs = await Snapshot.docs.map((doc)=>({...doc.data(),id:doc.id}))

  return docs
}