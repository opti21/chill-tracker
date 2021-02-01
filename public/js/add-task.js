let tzSelect = document.getElementById("tz-select")

if (tzSelect) {

  let tzGuess = moment.tz.guess()

  moment.tz.names().forEach(timezone => {
    let tzOption = document.createElement("option")
    tzOption.innerHTML = timezone
    if (tzGuess === timezone) {
      tzOption.setAttribute('selected', true)
    }
    tzSelect.append(tzOption)
  })
}
