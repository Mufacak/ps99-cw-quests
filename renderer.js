const fetchQuestMap = async() => {
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
  
  document.getElementById("nickName").innerText = " - @" + document.querySelector("#dtlUsersIdSuggestions option[value='"+userId+"']").innerText;

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
      document.getElementById("clanRank").innerText = ` ${vlpClanIndex}`;
    })
    .catch((error) => console.error("Chyba při načítání clan pozice:", error));
}

const findPlayerPosition = async() => {
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
      document.getElementById("userPointsAll").innerText =
        `/${bothClanPosition}   ||   ` || 0;
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
const fetchData = async() => {
  const selectedClan = localStorage.getItem("clan");
  const userId = getUserId();

  if (selectedClan == '' || userId == 'udefaultId') {
    return;
  }

  const questMap = await fetchQuestMap();
  if (!questMap) {
    console.error("Quest map nebyla načtena.");
    return;
  }

  fetch(`https://biggamesapi.io/api/clan/${selectedClan}`)
    .then((response) => response.json())
    .then((data) => {
      const clanPoints = data.data.Battles.GoalBattleTwo.Points;
      document.getElementById("clanPoints").innerText = `${formatNumber(
        clanPoints
      )}`;

      const goals = data.data.Battles.GoalBattleTwo.Goals;
      const tableBody = document.getElementById("tableBody");
      tableBody.innerHTML = "";

      goals.forEach((goal) => {
        let userContributions = goal.Contributions[userId] || "0";

        let uniqueContributorsCount =
          Object.keys(goal.Contributions).length || 0;
        let calc = userContributions / goal.Amount;
        let calc2 = Math.round(calc * goal.Stars);

        const row = `<tr>
          <td>${
            questMap[goal.Type]
              ? questMap[goal.Type]
              : `CHYBĚJÍCÍ QUEST: ${goal.Type}`
          }</td>
            <td>${goal.Progress}/${goal.Amount}</td>
            <td>${userContributions} [${calc2} ★]</td>
            <td>${uniqueContributorsCount}</td> 
          </tr>`;
        tableBody.innerHTML += row;
      });

      fetchClanPosition();
      findPlayerPosition();

      const now = new Date();
      const formattedDate = `${now.getDate()}. ${
        now.getMonth() + 1
      }. ${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      document.getElementById("lastUpdated").innerText = `${formattedDate}`;
    })
    .catch((error) => console.error("Error fetching data:", error));
}

const updateUsersSelectBox  = async() => {
  console.log('updateUsersSelectBox');
  
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

document.body.addEventListener('click', function(e) {
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