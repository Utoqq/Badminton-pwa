// ===== 羽球公平分組 v2.3 (含備份還原與階層優先級) =====

let players = JSON.parse(localStorage.getItem("players")) || [];
let todayPlayers = [];
let roundNumber = 0;
let gameStarted = false;
let teammateHistory = {};
let opponentHistory = {};
let groupHistory = {};
let currentMatches = [];

function save() {
    let appData = {
        players: players,
        teammateHistory: teammateHistory,
        opponentHistory: opponentHistory,
        groupHistory: groupHistory
    };
    // 主儲存
    localStorage.setItem("players", JSON.stringify(players));
    // 自動背景備份快照（防止單一紀錄損毀）
    localStorage.setItem("badminton_auto_snapshot", JSON.stringify(appData));
}

// ===== 備份與還原功能 =====
function exportData() {
    if (players.length === 0) {
        alert("目前沒有球友資料可以匯出！");
        return;
    }
    let appData = {
        players: players,
        teammateHistory: teammateHistory,
        opponentHistory: opponentHistory,
        groupHistory: groupHistory,
        version: "2.3",
        date: new Date().toISOString()
    };
    
    let blob = new Blob([JSON.stringify(appData, null, 2)], {type: "application/json"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = `badminton_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = JSON.parse(e.target.result);
            if (data && Array.isArray(data.players)) {
                if (confirm(`確定要還原 ${data.players.length} 位球友的資料嗎？這會覆蓋目前的資料。`)) {
                    players = data.players;
                    teammateHistory = data.teammateHistory || {};
                    opponentHistory = data.opponentHistory || {};
                    groupHistory = data.groupHistory || {};
                    save();
                    render();
                    alert("資料還原成功！");
                }
            } else {
                alert("檔案格式不正確！");
            }
        } catch (err) {
            alert("解析備份檔案失敗！");
        }
        // 清空 input 讓同個檔案可以重複選擇觸發
        event.target.value = "";
    };
    reader.readAsText(file);
}

function makeKey(a, b) {
    return a < b ? a + "_" + b : b + "_" + a;
}

function addRecord(obj, key) {
    obj[key] = (obj[key] || 0) + 1;
}

function getRecord(obj, key) {
    return obj[key] || 0;
}

function addPlayer() {
    let name = document.getElementById("name").value.trim();
    let level = Number(document.getElementById("level").value);
    if (!name) return;

    players.push({
        id: Date.now(),
        name: name,
        level: level || 1,
        play: 0,
        rest: 0,
        consecutive: 0
    });
    save();
    render();
    document.getElementById("name").value = "";
    document.getElementById("level").value = "";
}

function editPlayer(id) {
    let p = players.find(x => x.id === id);
    if (!p) return;
    let name = prompt("姓名", p.name);
    if (name) p.name = name;
    let level = prompt("能力值", p.level);
    if (level) p.level = Number(level);
    save();
    render();
}

function deletePlayer(id) {
    if (!confirm("確定刪除？")) return;
    players = players.filter(p => p.id !== id);
    todayPlayers = todayPlayers.filter(x => x !== id);
    save();
    render();
}

function deleteAllPlayers() {
    if (players.length === 0) {
        alert("目前沒有球友資料。");
        return;
    }
    if (!confirm("確定要刪除「全部」球友嗎？此動作無法復原喔！")) return;
    
    players = [];
    todayPlayers = [];
    save();
    render();
}

function selectAllPlayers() {
    todayPlayers = players.map(p => p.id);
    render();
}

function clearAllPlayers() {
    todayPlayers = [];
    render();
}

// ===== 畫面更新 =====
function render() {
    let box = document.getElementById("players");
    let select = document.getElementById("selectPlayers");
    if (!box || !select) return;

    box.innerHTML = "";
    select.innerHTML = "";

    let sortSelect = document.getElementById("sortType");
    let sortType = sortSelect ? sortSelect.value : "name";

    let sortedPlayers = [...players].sort((a, b) => {
        if (sortType === "level") {
            return b.level - a.level;
        } else {
            return a.name.localeCompare(b.name);
        }
    });

    sortedPlayers.forEach(p => {
        box.innerHTML += `
        <div class="player-compact">
            <div class="player-info">
                <span class="player-name">${p.name}</span>
                <span class="player-stats">Lv.${p.level} | 上:${p.play} 休:${p.rest} 連:${p.consecutive}</span>
            </div>
            <div class="player-actions">
                <button class="edit smallBtn" onclick="editPlayer(${p.id})">修改</button>
                <button class="delete smallBtn" onclick="deletePlayer(${p.id})">刪除</button>
            </div>
        </div>
        `;
    });

    sortedPlayers.forEach(p => {
        let checked = todayPlayers.includes(p.id) ? "checked" : "";
        select.innerHTML += `
        <label class="checkbox-label">
            <input type="checkbox" value="${p.id}" ${checked}>
            ${p.name}
        </label>
        `;
    });
}

// ===== 核心計算與邏輯 =====
function power(team) {
    return team.reduce((sum, p) => sum + p.level, 0);
}

function groupKey(group) {
    return group.map(p => p.id).sort().join("_");
}

function pairKey(a, b) {
    return makeKey(a.id, b.id);
}

function teammateScore(a, b) {
    return getRecord(teammateHistory, pairKey(a, b));
}

function opponentScore(team1, team2) {
    let score = 0;
    team1.forEach(a => {
        team2.forEach(b => {
            score += getRecord(opponentHistory, pairKey(a, b));
        });
    });
    return score;
}

function splitTeams(group) {
    return [
        [[group[0], group[1]], [group[2], group[3]]],
        [[group[0], group[2]], [group[1], group[3]]],
        [[group[0], group[3]], [group[1], group[2]]]
    ];
}

function getMinBalanceDiff(group) {
    let p = group;
    let diff1 = Math.abs((p[0].level + p[1].level) - (p[2].level + p[3].level));
    let diff2 = Math.abs((p[0].level + p[2].level) - (p[1].level + p[3].level));
    let diff3 = Math.abs((p[0].level + p[3].level) - (p[1].level + p[2].level));
    return Math.min(diff1, diff2, diff3);
}

function chooseBestTeams(group) {
    let choices = splitTeams(group);
    let best = null;
    let bestScore = 999999;

    let sortedGroup = [...group].sort((a, b) => b.level - a.level);
    let top1 = sortedGroup[0];
    let top2 = sortedGroup[1];

    choices.forEach(c => {
        let team1 = c[0];
        let team2 = c[1];
        let penalty = 0;

        let isTopTogether = (team1.includes(top1) && team1.includes(top2)) || 
                           (team2.includes(top1) && team2.includes(top2));
        if (isTopTogether) {
            penalty += 1000; 
        }

        let balance = Math.abs(power(team1) - power(team2));
        let gap1 = Math.abs(team1[0].level - team1[1].level);
        let gap2 = Math.abs(team2[0].level - team2[1].level);
        let gapDiff = Math.abs(gap1 - gap2);

        let teammate = teammateScore(team1[0], team1[1]) + teammateScore(team2[0], team2[1]);
        let opponent = opponentScore(team1, team2);

        let score = penalty
                  + balance * 75 
                  + gapDiff * 10 
                  + teammate * 25 
                  + opponent * 15;

        if (score < bestScore) {
            bestScore = score;
            best = c;
        }
    });
    return best;
}

function getCombinations(arr, size) {
    let result = [];
    function walk(start, current) {
        if (current.length === size) {
            result.push([...current]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            current.push(arr[i]);
            walk(i + 1, current);
            current.pop();
        }
    }
    walk(0, []);
    return result;
}

function getGroupMetrics(group) {
    let sumConsecutive = group.reduce((sum, p) => sum + p.consecutive, 0);
    let sumPlay = group.reduce((sum, p) => sum + p.play, 0);
    let negSumRest = -group.reduce((sum, p) => sum + p.rest, 0);
    let groupRep = getRecord(groupHistory, groupKey(group));
    let balanceDiff = getMinBalanceDiff(group);

    return [sumConsecutive, sumPlay, negSumRest, groupRep, balanceDiff];
}

function compareMetrics(m1, m2) {
    for (let i = 0; i < m1.length; i++) {
        if (m1[i] < m2[i]) return -1;
        if (m1[i] > m2[i]) return 1;
    }
    return 0;
}

function choosePlayers(list) {
    let groups = getCombinations(list, 4);
    if (groups.length === 0) return null;

    let bestGroups = [];
    let bestMetrics = null;

    groups.forEach(group => {
        let metrics = getGroupMetrics(group);
        if (!bestMetrics) {
            bestMetrics = metrics;
            bestGroups = [group];
        } else {
            let cmp = compareMetrics(metrics, bestMetrics);
            if (cmp < 0) {
                bestMetrics = metrics;
                bestGroups = [group];
            } else if (cmp === 0) {
                bestGroups.push(group);
            }
        }
    });

    let randomIndex = Math.floor(Math.random() * bestGroups.length);
    return bestGroups[randomIndex];
}

function recordMatch(team1, team2) {
    addRecord(teammateHistory, pairKey(team1[0], team1[1]));
    addRecord(teammateHistory, pairKey(team2[0], team2[1]));
    team1.forEach(a => {
        team2.forEach(b => {
            addRecord(opponentHistory, pairKey(a, b));
        });
    });
    addRecord(groupHistory, groupKey(team1.concat(team2)));
}

function makeRound() {
    let checked = [...document.querySelectorAll("#selectPlayers input:checked")].map(x => Number(x.value));
    if (checked.length < 4) {
        alert("至少選4人");
        return;
    }

    todayPlayers = checked;
    let available = players.filter(p => todayPlayers.includes(p.id));
    let courts = Number(document.getElementById("court").value);
    let result = "";
    currentMatches = [];

    for (let i = 0; i < courts; i++) {
        if (available.length < 4) break;
        let group = choosePlayers(available);
        available = available.filter(p => !group.includes(p));
        let teams = chooseBestTeams(group);
        recordMatch(teams[0], teams[1]);

        teams[0].concat(teams[1]).forEach(p => {
            p.play++;
            p.consecutive++;
        });

        currentMatches.push({ play: teams[0].concat(teams[1]) });

        result += `
        <div class="match">
            第 ${i + 1} 號場<br><br>
            <b>${teams[0][0].name} + ${teams[0][1].name}</b>
            <br>VS<br>
            <b>${teams[1][0].name} + ${teams[1][1].name}</b>
        </div>
        `;
    }

    available.forEach(p => {
        p.rest++;
        p.consecutive = 0;
    });

    if (available.length) {
        result += `
        <div class="match">
            休息：${available.map(p => p.name).join("、")}
        </div>
        `;
    }

    document.getElementById("result").innerHTML = result;
    updateStatus();
    save();
}

function updateStatus() {
    let box = document.getElementById("status");
    if (!box) return;

    if (!gameStarted) {
        box.innerHTML = "尚未開始球局";
        return;
    }

    let playing = [];
    currentMatches.forEach(m => {
        m.play.forEach(p => {
            playing.push(p.name);
        });
    });

    let resting = players.filter(p => todayPlayers.includes(p.id) && !playing.includes(p.name));

    box.innerHTML = `
    第 ${roundNumber} 輪<br><br>
    上場：${playing.join("、")}<br><br>
    休息：${resting.map(p => p.name).join("、")}
    `;
}

function nextRound() {
    if (!gameStarted) {
        let selected = [...document.querySelectorAll("#selectPlayers input:checked")].map(x => Number(x.value));
        if (selected.length < 4) {
            alert("請先選擇球友");
            return;
        }
        todayPlayers = selected;
        gameStarted = true;
        roundNumber = 1;
    } else {
        roundNumber++;
    }
    makeRound();
    render();
}

function endToday() {
    if (!confirm("確定結束今天球局？")) return;

    players.forEach(p => {
        p.play = 0;
        p.rest = 0;
        p.consecutive = 0;
    });

    todayPlayers = [];
    roundNumber = 0;
    gameStarted = false;
    teammateHistory = {};
    opponentHistory = {};
    groupHistory = {};
    currentMatches = [];

    document.getElementById("result").innerHTML = "今日球局已結束";
    document.getElementById("status").innerHTML = "尚未開始球局";
    save();
    render();
}

render();