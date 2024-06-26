const fetchQuestMap = async () => {
  try {
    const response = await fetch("https://clan.varmi.cz/api/questmap");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const questMap = await response.json();
    return questMap;
  } catch (error) {
    console.error("Chyba při načítání quest map:", error);
  }
}

const formatNumber = (num, isCWPoints = false) => {
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);

  const formatWithOptionalDecimal = (value, divider, unit) => {
    const dividedValue = value / divider;
    let formattedNumber;
    if (Math.floor(dividedValue) !== dividedValue) {
      formattedNumber = dividedValue.toFixed(2);
    } else {
      formattedNumber = dividedValue.toFixed(0);
    }
    return sign + formattedNumber + unit;
  };

  if (isCWPoints) {
    if (absNum < 1000) return sign + absNum.toFixed(0);
    if (absNum < 1000000) return sign + (absNum / 1000).toFixed(2) + "k";
    if (absNum < 1000000000)
      return formatWithOptionalDecimal(absNum, 1000000, "M");
    if (absNum < 1000000000000)
      return formatWithOptionalDecimal(absNum, 1000000000, "B");
  } else {
    if (absNum < 1000) return sign + absNum.toFixed(0);
    if (absNum < 1000000) return sign + (absNum / 1000).toFixed(0) + "k";
    if (absNum < 1000000000)
      return formatWithOptionalDecimal(absNum, 1000000, "M");
    if (absNum < 1000000000000)
      return formatWithOptionalDecimal(absNum, 1000000000, "B");
    return formatWithOptionalDecimal(absNum, 1000000000000, "T");
  }

  return sign + absNum;
}

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const userId = document.getElementById("userId").value;
  const selectedClan = document.querySelector(
    'input[name="clanChoice"]:checked'
  ).value;

  localStorage.setItem("clan", selectedClan);
  localStorage.setItem("userId", userId);
  document.getElementById("login").style.display = "none";
  document.getElementById("container").style.display = "block";

  document.getElementById("nickName").innerText = " - @" + document.querySelector("#dtlUsersIdSuggestions option[value='" + userId + "']").innerText;

  fetchData();
});


const getUserId = () => {
  const storedId = localStorage.getItem("userId");
  return storedId ? `u${storedId}` : "udefaultId";
}

function fetchClanPosition() {
  fetch(
    "https://biggamesapi.io/api/clans?page=1&pageSize=100&sort=Points&sortOrder=desc",
    {}
  )
    .then((response) => response.json())
    .then((data) => {
      const clans = data.data;
      const vlpClanIndex = clans.findIndex((clan) => clan.Name === "VLP") + 1;
      const vlpClanIndex2 = clans.findIndex((clan) => clan.Name === "VLP2") + 1;
      document.getElementById("clanRank").innerText = `${vlpClanIndex}`;
      document.getElementById("clanRank2").innerText = `${vlpClanIndex2}`;
    })
    .catch((error) => console.error("Chyba při načítání clan pozice:", error));
}

const findPlayerPosition = async () => {
  try {
    const selectedClan = localStorage.getItem("clan");
    const response = await fetch(
      `https://clan.varmi.cz/api/${selectedClan}/leaderboard`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const members = await response.json();

    const userId = localStorage.getItem("userId");
    const rbxId = parseInt(userId, 10);

    const player = members.find((member) => member.robloxId === rbxId);

    if (player) {
      console.log(`Pozice hráče: ${player.position}`);
      let position = player.position;
      let points = player.clanPoints;
      let bothClanPosition = player.allPosition;
      document.getElementById("userPosition").innerText = `${position}` || 0;
      document.getElementById("userPointsAll").innerText = `${bothClanPosition}` || 0;
      document.getElementById("userPoints").innerText = `${points}` || 0;
      return player.position;
    } else {
      console.log("Hráč nebyl nalezen");
      return null;
    }
  } catch (error) {
    console.error("Chyba při hledání hráče: ", error);
  }
}
const fetchData = async () => {
  const selectedClan = localStorage.getItem("clan");
  const userId = getUserId();

  if (selectedClan == '' || userId == 'udefaultId') {
    return;
  }

  const questMap = await fetchQuestMap();
  if (!questMap) {
    console.error("Quest map nebyla načtena.");

    document.getElementById("alertMsg").innerText = 'Asi nejede net?';
    document.getElementById("alertMsg").style.display = 'inline';
    return;
  } else {
    document.getElementById("alertMsg").style.display = 'none';
  }

  fetch(`https://biggamesapi.io/api/clan/${selectedClan}`)
    .then((response) => response.json())
    .then(async (data) => {
      const clanPoints = data.data.Battles.GoalBattleTwo.Points;
      document.getElementById("clanPoints").innerText = `${formatNumber(clanPoints)}`;

      const goals = data.data.Battles.GoalBattleTwo.Goals;
      const tableBody = document.getElementById("tableBody");
      tableBody.innerHTML = "";

      for (const goal of goals) {
        let userContributions = goal.Contributions[userId] || "0";

        let uniqueContributorsCount = Object.keys(goal.Contributions).length || 0;
        let calc = userContributions / goal.Amount;
        let calc2 = Math.round(calc * goal.Stars);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${questMap[goal.Type] ? questMap[goal.Type] : `CHYBĚJÍCÍ QUEST: ${goal.Type}`}</td>
          <td>${goal.Progress}&nbsp;/&nbsp;${goal.Amount}</td>
          <td>${userContributions}&nbsp;[${calc2}&nbsp;★]</td>
          <td>${uniqueContributorsCount}</td>
        `;
        row.onclick = () => showPlayerDetails(goal.Contributions);
        if (userContributions == 0) {
          row.classList.add("hiliItemNoParticipation");
        }
        tableBody.appendChild(row);
      }

      fetchClanPosition();
      findPlayerPosition();

      const now = new Date();
      const formattedDate = `${now.getDate()}. ${now.getMonth() + 1
        }. ${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      document.getElementById("lastUpdated").innerText = `${formattedDate}`;
    })
    .catch((error) => console.error("Error fetching data:", error));
}

async function showPlayerDetails(contributions) {
  const mainContent = document.getElementById('container');
  const detailContent = document.createElement('div');
  detailContent.id = 'playerDetails';

  const backButton = document.createElement('button');
  backButton.id = 'backButton';
  backButton.classList.add('button');
  backButton.textContent = 'Zpět';
  backButton.onclick = () => {
    detailContent.remove();
    mainContent.style.display = 'block';
  };

  const playerList = document.createElement('ul');

  try {
    const allPlayers = await fetch('https://clan.varmi.cz/api/all/leaderboard').then(res => res.json());

    const playerContributions = allPlayers.reduce((acc, player) => {
      const userId = `u${player.robloxId}`;
      if (contributions[userId]) {
        acc.push({ nick: player.nick, contribution: contributions[userId], robloxId: player.robloxId });
      }
      return acc;
    }, []);

    playerContributions.sort((a, b) => b.contribution - a.contribution);

    playerContributions.forEach(({ nick, contribution, robloxId }) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="nickname">${nick}</span> - [Progress: ${contribution}]`;
      if (localStorage.getItem('userId') == robloxId) {
        li.classList.add("hiliItem");
      }
      playerList.appendChild(li);
    });

    if (playerContributions.length == 0) {
      const li = document.createElement('li');
      li.innerHTML = '<strong>Nikde nikdo. Necheš máknout? :-)</strong>';
      playerList.appendChild(li);
    }
  } catch (error) {
    console.error("Error loading player details: ", error);
    const li = document.createElement('li');
    li.textContent = 'Nepodařilo se načíst detaily hráčů.';
    playerList.appendChild(li);
  }

  detailContent.appendChild(backButton);
  detailContent.appendChild(playerList);

  mainContent.parentNode.insertBefore(detailContent, mainContent);
  mainContent.style.display = 'none';
}


async function showPlayerRankDetails(clan = '') {
  console.log('showPlayerRankDetails', clan);
  const mainContent = document.getElementById('container');
  const detailContent = document.createElement('div');
  detailContent.id = 'playerRankDetails';

  const backButton = document.createElement('button');
  backButton.id = 'backButton';
  backButton.classList.add('button');
  backButton.textContent = 'Zpět';
  backButton.onclick = () => {
    detailContent.remove();
    mainContent.style.display = 'block';
  };

  detailContent.appendChild(backButton);

  const playerList = document.createElement('ol');

  try {
    const allPlayers = await fetch('https://clan.varmi.cz/api/all/leaderboard').then(res => res.json());


    allPlayers.sort((a, b) => a.position - b.position);

    let lastPoint = 0;

    allPlayers.forEach(player => {
      if (clan && clan.toUpperCase() != player.clan.toUpperCase()) {
        return;
      }

      let missingPoints = lastPoint - player.clanPoints < 0 ? 0 : lastPoint - player.clanPoints;

      const li = document.createElement('li');
      li.innerHTML = `${player.nick} (${player.clan}) - [${formatNumber(player.clanPoints)}] - [↑&nbsp;${missingPoints}]`;

      if (localStorage.getItem('userId') == player.robloxId) {
        li.classList.add("hiliItem");
      }

      playerList.appendChild(li);

      lastPoint = player.clanPoints;
    });
  } catch (error) {
    console.error("Error loading player rank details: ", error);
    const li = document.createElement('li');
    li.textContent = 'Nepodařilo se načíst detaily hráčů.';
    playerList.appendChild(li);
  }

  detailContent.appendChild(playerList);

  mainContent.parentNode.insertBefore(detailContent, mainContent);
  mainContent.style.display = 'none';
}

async function showClanRankDetails() {
  const mainContent = document.getElementById('container');
  const detailContent = document.createElement('div');
  detailContent.id = 'playerRankDetails';

  const backButton = document.createElement('button');
  backButton.id = 'backButton';
  backButton.classList.add('button');
  backButton.textContent = 'Zpět';
  backButton.onclick = () => {
    detailContent.remove();
    mainContent.style.display = 'block';
  };

  detailContent.appendChild(backButton);

  const clanList = document.createElement('ol');

  try {
    const topClans = await fetch('https://biggamesapi.io/api/clans?page=1&pageSize=100&sort=Points&sortOrder=desc').then(res => res.json().then((data => data.data)));

    let lastPoint = 0;
    let top1Point = topClans[0]['Points'];
    let top10Point = topClans[9]['Points'];
    let top50Point = topClans[49]['Points'];

    topClans.forEach(clan => {
      let missingPoints = lastPoint - clan.Points < 0 ? 0 : lastPoint - clan.Points;

      const li = document.createElement('li');
      li.innerHTML = `<strong>${clan.Name}</strong> - [${clan.CountryCode} / ${clan.Members}] - [${formatNumber(clan.Points)}] - [↑&nbsp;${formatNumber(missingPoints)}]`;

      if (clan.Name.toUpperCase() == 'VLP' || clan.Name.toUpperCase() == 'VLP2') {
        const targets = [{ pos: 1, points: top1Point }, { pos: 10, points: top10Point }, { pos: 50, points: top50Point }];
        const pointsToText = targets.reduce((text, target) => (
          target.points > clan.Points ? `[↑T${target.pos}&nbsp;${formatNumber(target.points - clan.Points)}]` : text
        ), '');

        li.innerHTML += ' - ' + pointsToText;

        li.classList.add("hiliItem");
        li.id = clan.Name.toUpperCase();
      } else {
        if (clan.CountryCode == 'CZ') {
          li.classList.add("hiliItemCountry");
        }
      }

      clanList.appendChild(li);

      lastPoint = clan.Points;
    });
  } catch (error) {
    console.error("Error loading clan rank details: ", error);
    const li = document.createElement('li');
    li.textContent = 'Nepodařilo se načíst seznam klanů.';
    clanList.appendChild(li);
  }

  detailContent.appendChild(clanList);

  mainContent.parentNode.insertBefore(detailContent, mainContent);
  mainContent.style.display = 'none';
}

document.getElementById("userPosition").addEventListener('click', (evt) => showPlayerRankDetails(localStorage.getItem("clan")));
document.getElementById("userPointsAll").addEventListener('click', (evt) => showPlayerRankDetails(''));
document.getElementById("clanRank").addEventListener('click', showClanRankDetails);
document.getElementById("clanRank2").addEventListener('click', showClanRankDetails);

const updateUsersSelectBox = async () => {
  try {
    const selectedClan = document.querySelector(
      'input[name="clanChoice"]:checked'
    ).value;

    const response = await fetch(
      `https://clan.varmi.cz/api/${selectedClan}/leaderboard`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let members = await response.json();

    let dtlUsersId = document.getElementById("dtlUsersIdSuggestions");
    let userId = document.getElementById("userId");

    dtlUsersId.innerHTML = '';
    userId.value = '';

    members = members.sort((a, b) => {
      if (a.nick < b.nick) {
        return -1;
      }
    });

    for (let key in members) {
      let option = document.createElement("option");

      option.innerText = members[key]['nick'];
      option.value = members[key]['robloxId'];

      dtlUsersId.append(option);
    }
  } catch (error) {
    console.error("Chyba při aktualizaci seznamu hráčů: ", error);
  }
}

document.body.addEventListener('click', function (e) {
  var target = e.target;

  if (target.nodeName.toUpperCase() === 'INPUT' && target.type.toUpperCase() == 'RADIO') {
    localStorage.setItem("clan", target.value);

    updateUsersSelectBox();
  }

  e.stopPropagation()
});

const closeWindow = () => {
  window.api.closeWindow();
}

document.addEventListener("DOMContentLoaded", (event) => {
  localStorage.clear();

  updateUsersSelectBox();

  setInterval(fetchData, 2000);
})
