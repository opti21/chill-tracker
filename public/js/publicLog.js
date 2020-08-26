let dateElem = document.getElementById("logdate")

let rawDate = dateElem.innerHTML

dateElem.innerHTML = moment.utc(rawDate).format("L")
