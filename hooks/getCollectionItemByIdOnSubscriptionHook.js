const { db } = require("../firebase/config");
const {collection,doc,onSnapshot} = require("firebase/firestore")

module.exports = (collectionName,docId,setMethod) => {
    onSnapshot(doc(db, collectionName, docId), (doc) => {
         setMethod({...doc.data(),id:doc.id})
    });
}