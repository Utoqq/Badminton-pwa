// ===== 羽球公平分組 v2 =====

// 球友資料
let players =
JSON.parse(localStorage.getItem("players")) || [];

  
// 今日參加球友
let todayPlayers = [];


// 今日輪數
let roundNumber = 0;


// 是否開始
let gameStarted = false;


// 歷史紀錄
let teammateHistory = {};
let opponentHistory = {};
let groupHistory = {};


// 本輪結果
let currentMatches = [];




// 儲存資料
function save(){

    localStorage.setItem(
        "players",
        JSON.stringify(players)
    );

}



// 產生唯一鍵
function makeKey(a,b){

    return a < b

    ? a + "_" + b

    : b + "_" + a;

}



// 增加紀錄
function addRecord(obj,key){

    obj[key] =
    (obj[key] || 0) + 1;

}



// 取得紀錄
function getRecord(obj,key){

    return obj[key] || 0;

}




// 新增球友
function addPlayer(){

    let name =
    document.getElementById("name")
    .value
    .trim();


    let level =
    Number(
        document.getElementById("level")
        .value
    );


    if(!name){

        return;

    }



    players.push({

        id:Date.now(),

        name:name,

        level:level || 1,

        play:0,

        rest:0,

        consecutive:0

    });



    save();

    render();


    document.getElementById("name").value="";

    document.getElementById("level").value="";


}





// 修改球友
function editPlayer(id){

    let p =
    players.find(
        x=>x.id===id
    );


    if(!p){

        return;

    }



    let name =
    prompt(
        "姓名",
        p.name
    );


    if(name){

        p.name=name;

    }



    let level =
    prompt(
        "能力值",
        p.level
    );


    if(level){

        p.level =
        Number(level);

    }



    save();

    render();


}






// 刪除球友
function deletePlayer(id){


    if(!confirm("確定刪除？")){

        return;

    }


    players =
    players.filter(
        p=>p.id!==id
    );


    todayPlayers =
    todayPlayers.filter(
        x=>x!==id
    );


    save();

    render();


}






// 全選
function selectAllPlayers(){

    todayPlayers =
    players.map(
        p=>p.id
    );


    render();

}




// 清除選取
function clearAllPlayers(){

    todayPlayers=[];

    render();

}
// ===== 畫面更新 =====

function render(){


    let box =
    document.getElementById("players");


    let select =
    document.getElementById("selectPlayers");



    if(!box || !select){

        return;

    }



    box.innerHTML="";

    select.innerHTML="";





    players.forEach(p=>{


        box.innerHTML +=

        `

        <div class="player">


        <div style="
        font-size:22px;
        font-weight:bold">

        ${p.name}

        </div>


        <div>

        能力值：
        ${p.level}

        </div>


        <div>

        上場：
        ${p.play}

       　

        休息：
        ${p.rest}

        </div>


        <div>

        連續上場：
        ${p.consecutive}

        </div>



        <button class="edit"
        onclick="editPlayer(${p.id})">

        修改

        </button>


        <button class="delete"
        onclick="deletePlayer(${p.id})">

        刪除

        </button>



        </div>

        `;



    });





    players.forEach(p=>{


        let checked =

        todayPlayers.includes(p.id)

        ?

        "checked"

        :

        "";



        select.innerHTML +=


        `

        <label>

        <input
        type="checkbox"
        value="${p.id}"
        ${checked}>


        ${p.name}


        </label>


        <br>


        `;



    });



}







// ===== 分組計算 =====


// 能力值總和
function power(team){

    return team.reduce(

        (sum,p)=>
        sum+p.level,

        0

    );

}




// 四人組合 key
function groupKey(group){

    return group

    .map(
        p=>p.id
    )

    .sort()

    .join("_");

}






// 兩人組 key
function pairKey(a,b){

    return makeKey(
        a.id,
        b.id
    );

}






// 計算搭檔重複
function teammateScore(a,b){

    return getRecord(

        teammateHistory,

        pairKey(a,b)

    );

}






// 計算對手重複
function opponentScore(team1,team2){


    let score=0;



    team1.forEach(a=>{


        team2.forEach(b=>{


            score +=

            getRecord(

                opponentHistory,

                pairKey(a,b)

            );


        });


    });



    return score;


}







// 產生三種分隊方式
function splitTeams(group){


    return [

        [
            [group[0],group[1]],
            [group[2],group[3]]
        ],


        [
            [group[0],group[2]],
            [group[1],group[3]]
        ],


        [
            [group[0],group[3]],
            [group[1],group[2]]
        ]


    ];


}







// 選最佳隊伍
function chooseBestTeams(group){



    let choices =
    splitTeams(group);



    let best=null;

    let bestScore=999999;



    choices.forEach(c=>{


        let team1=c[0];

        let team2=c[1];



        let balance =

        Math.abs(

            power(team1)

            -

            power(team2)

        );



        let teammate =

        teammateScore(
            team1[0],
            team1[1]
        )

        +

        teammateScore(
            team2[0],
            team2[1]
        );



        let opponent =

        opponentScore(
            team1,
            team2
        );



        let score =

        balance * 5

        +

        teammate * 50

        +

        opponent * 20;





        if(score < bestScore){


            bestScore=score;

            best=c;


        }


    });



    return best;


}
// ===== 選人核心 =====


// 計算球友優先分數
function playerWeight(p){


    return (

        p.rest * 20

        -

        p.play * 10

        -

        p.consecutive * 15

    );


}







// 取得所有四人組合
function getCombinations(arr,size){


    let result=[];



    function walk(start,current){



        if(current.length===size){


            result.push(
                [...current]
            );


            return;

        }




        for(
            let i=start;
            i<arr.length;
            i++
        ){


            current.push(
                arr[i]
            );


            walk(
                i+1,
                current
            );


            current.pop();


        }


    }



    walk(
        0,
        []
    );



    return result;


}







// 評估四人組
function groupScore(group){



    let score=0;



    // 整組重複懲罰

    score +=

    getRecord(

        groupHistory,

        groupKey(group)

    )

    *100;





    // 上場不平均

    group.forEach(p=>{


        score +=

        p.play * 2;



        score -=

        p.rest;



        score +=

        p.consecutive * 10;



    });






    return score;


}







// 找最佳四人
function choosePlayers(list){



    let groups =

    getCombinations(

        list,

        4

    );



    let best=null;

    let bestScore=999999;




    groups.forEach(group=>{



        let score =

        groupScore(group);




        if(score < bestScore){


            bestScore=score;

            best=group;


        }



    });



    return best;


}







// 記錄一場比賽
function recordMatch(team1,team2){



    // 搭檔

    addRecord(

        teammateHistory,

        pairKey(
            team1[0],
            team1[1]
        )

    );


    addRecord(

        teammateHistory,

        pairKey(
            team2[0],
            team2[1]
        )

    );





    // 對手

    team1.forEach(a=>{


        team2.forEach(b=>{


            addRecord(

                opponentHistory,

                pairKey(a,b)

            );


        });


    });






    // 四人組

    addRecord(

        groupHistory,

        groupKey(

            team1.concat(team2)

        )

    );



}







// ===== 產生一輪 =====


function makeRound(){



    let checked =


    [

        ...document.querySelectorAll(

        "#selectPlayers input:checked"

        )

    ]

    .map(

        x=>Number(x.value)

    );




    if(checked.length < 4){


        alert(
            "至少選4人"
        );


        return;

    }





    todayPlayers=checked;




    let available =

    players.filter(

        p=>

        todayPlayers.includes(p.id)

    );






    let courts =

    Number(

        document.getElementById("court")
        .value

    );





    let result="";



    currentMatches=[];




    for(
        let i=0;
        i<courts;
        i++
    ){



        if(available.length < 4){

            break;

        }




        let group =

        choosePlayers(
            available
        );



        available =

        available.filter(

            p=>

            !group.includes(p)

        );





        let teams =

        chooseBestTeams(
            group
        );






        recordMatch(

            teams[0],
            teams[1]

        );






        teams[0]
        .concat(teams[1])
        .forEach(p=>{


            p.play++;

            p.consecutive++;


        });





        currentMatches.push({

            play:

            teams[0]
            .concat(teams[1])

        });






        result +=


        `

        <div class="match">


        第 ${i+1} 號場


        <br><br>


        <b>

        ${teams[0][0].name}

        +

        ${teams[0][1].name}

        </b>


        <br>

        VS

        <br>


        <b>

        ${teams[1][0].name}

        +

        ${teams[1][1].name}

        </b>



        </div>


        `;



    }





    available.forEach(p=>{


        p.rest++;

        p.consecutive=0;


    });






    if(available.length){


        result +=


        `

        <div class="match">

        休息：

        ${
        available.map(
            p=>p.name
        )
        .join("、")

        }

        </div>


        `;


    }





    document.getElementById("result")
    .innerHTML=result;



    updateStatus();



    save();


}
// ===== 今日狀態 =====


function updateStatus(){


    let box =
    document.getElementById("status");



    if(!box){

        return;

    }



    if(!gameStarted){


        box.innerHTML =
        "尚未開始球局";


        return;

    }





    let playing=[];


    currentMatches.forEach(m=>{


        m.play.forEach(p=>{


            playing.push(
                p.name
            );


        });


    });





    let resting =

    players.filter(

        p=>

        todayPlayers.includes(p.id)

        &&

        !playing.includes(p.name)

    );





    box.innerHTML =


    `

    第 ${roundNumber} 輪


    <br><br>


    上場：

    ${

    playing.join("、")

    }


    <br><br>


    休息：

    ${

    resting.map(
        p=>p.name
    )
    .join("、")

    }


    `;



}







// ===== 下一輪 =====


function nextRound(){



    if(!gameStarted){



        let selected =


        [

        ...document.querySelectorAll(

        "#selectPlayers input:checked"

        )

        ]

        .map(

            x=>Number(x.value)

        );




        if(selected.length < 4){


            alert(
                "請先選擇球友"
            );


            return;

        }




        todayPlayers=selected;


        gameStarted=true;


        roundNumber=1;



    }

    else{


        roundNumber++;


    }




    makeRound();



    render();



}







// ===== 結束今日 =====


function endToday(){



    if(
        !confirm(
            "確定結束今天球局？"
        )
    ){

        return;

    }





    players.forEach(p=>{


        p.play=0;

        p.rest=0;

        p.consecutive=0;


    });





    todayPlayers=[];


    roundNumber=0;


    gameStarted=false;



    teammateHistory={};

    opponentHistory={};

    groupHistory={};



    currentMatches=[];





    document.getElementById("result")
    .innerHTML=
    "今日球局已結束";



    document.getElementById("status")
    .innerHTML=
    "尚未開始球局";




    save();


    render();


}







// 啟動

render();
