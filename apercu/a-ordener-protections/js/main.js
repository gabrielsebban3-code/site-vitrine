(function () {
  var now = new Date();
  var day = now.getDay(); // 0 = dimanche
  var mins = now.getHours() * 60 + now.getMinutes();
  var weekday = day >= 1 && day <= 5;
  var open = weekday && ((mins >= 540 && mins < 750) || (mins >= 840 && mins < 1080));

  var etat = document.getElementById('etat');
  if (etat) {
    if (open) {
      etat.textContent = 'Boutique ouverte' + (mins < 750 ? ', ferme à 12 h 30' : ', ferme à 18 h');
      etat.classList.add('ouvert');
    } else if (weekday && mins >= 750 && mins < 840) {
      etat.textContent = 'Fermé le midi, réouverture à 14 h · dépannage 24 h/24';
    } else {
      etat.textContent = 'Boutique fermée, dépannage 24 h/24 au même numéro';
    }
  }

  var row = document.querySelector('.horaires tr[data-j="' + day + '"]');
  if (row) row.classList.add('auj');
})();
