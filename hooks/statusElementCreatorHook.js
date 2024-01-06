export default ( status)=> {
    if(status == 0) {
        return <span className="warning-box">Devam Ediyor</span>
    }

    if(status == 1) {
        return <span className="green-box">Tamamlandı</span>
    }

    if(status == 2) {
        return <span className="red-box">İptal edildi</span>
    }
}