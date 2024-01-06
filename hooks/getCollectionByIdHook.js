const { getDoc,collection,doc } = require("firebase/firestore")
const config = require("../firebase/config.js")

module.exports = async (collectionName,id) => {
    const docRef = doc(config.db,collectionName,id)
  const Snapshot = await getDoc(docRef)
  const docData = await Snapshot.data()
  return {...docData,id}
}