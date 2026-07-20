let players =
JSON.parse(localStorage.getItem("players")) || [];

let todayPlayers = [];

let roundNumber = 0;

let gameStarted = false;

let lastMatches = [];

let teammateHistory = {};

let opponentHistory = {};

let courtHistory = {};



function save(){

    localStorage.setItem(
        "players",
        JSON.stringify(players)
    );

}





function addPlayer(){

    let name =
    document.getElementById("name")
    .value.trim();


    let level =
    Number(
        document.getElementById("level").value
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






function editPlayer(id){


    let p =
    players.find(
        x=>x.id===id
    );


    let name =
    prompt(
        "修改姓名",
        p.name
    );


    if(name){

        p.name=name;

    }


    let level =
    prompt(
        "修改能力值",
        p.level
    );


    if(level){

        p.level =
        Number(level);

    }


    save();

    render();


}






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






function selectAllPlayers(){

    todayPlayers =
    players.map(
        p=>p.id
    );


    render();

}






function clearAllPlayers(){

    todayPlayers=[];

    render();

}






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




    let list=[...players];


    list.sort((a,b)=>{


        if(a.play!==b.play){

            return a.play-b.play;

        }


        return b.rest-a.rest;


    });




    list.forEach(p=>{


        box.innerHTML +=

        `

        <div class="player">


        <div style="font-size:22px;font-weight:bold">

        ${p.name}

        </div>


        <div>

        能力值：${p.level}

        </div>


        <div>

        上場 ${p.play} 場　
        休息 ${p.rest} 場

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
function pairKey(a,b){

    return a.id < b.id

    ?

    a.id+"_"+b.id

    :

    b.id+"_"+a.id;

}






function groupKey(arr){

    return arr
    .map(
        p=>p.id
    )
    .sort()
    .join("_");

}






function teamPower(team){

    return team.reduce(

        (sum,p)=>
        sum+p.level,

        0

    );

}






function getHistory(obj,a,b){

    let key =
    pairKey(a,b);


    return obj[key] || 0;

}






function addHistory(obj,a,b){

    let key =
    pairKey(a,b);


    obj[key] =
    (obj[key] || 0)+1;

}






function getCandidateTeams(players4){



    let result=[];



    let a=players4[0];

    let b=players4[1];

    let c=players4[2];

    let d=players4[3];




    result.push(

        [

            [
                a,b
            ],

            [
                c,d
            ]

        ]

    );



    result.push(

        [

            [
                a,c
            ],

            [
                b,d
            ]

        ]

    );



    result.push(

        [

            [
                a,d
            ],

            [
                b,c
            ]

        ]

    );



    return result;


}








function bestTeams(group){



    let choices =
    getCandidateTeams(group);



    let best=null;

    let bestScore=999999;




    choices.forEach(match=>{


        let team1=match[0];

        let team2=match[1];



        let powerDiff =

        Math.abs(

            teamPower(team1)

            -

            teamPower(team2)

        );





        let repeat =


        getHistory(

            teammateHistory,

            team1[0],

            team1[1]

        )

        +

        getHistory(

            teammateHistory,

            team2[0],

            team2[1]

        );






        let opponent =


        getHistory(

            opponentHistory,

            team1[0],

            team2[0]

        )

        +

        getHistory(

            opponentHistory,

            team1[0],

            team2[1]

        )

        +

        getHistory(

            opponentHistory,

            team1[1],

            team2[0]

        )

        +

        getHistory(

            opponentHistory,

            team1[1],

            team2[1]

        );






        let score =


        powerDiff*5

        +

        repeat*50

        +

        opponent*20;





        if(score < bestScore){


            bestScore=score;

            best=match;


        }


    });



    return best;


}









function selectPlayersForRound(list){



    let arr=[...list];



    arr.sort((a,b)=>{


        let A =

        a.rest*10

        -

        a.play*5

        -

        a.consecutive*20;



        let B =

        b.rest*10

        -

        b.play*5

        -

        b.consecutive*20;



        return B-A;


    });



    return arr.slice(0,4);


}







function saveMatchHistory(team1,team2){



    addHistory(

        teammateHistory,

        team1[0],

        team1[1]

    );


    addHistory(

        teammateHistory,

        team2[0],

        team2[1]

    );





    team1.forEach(a=>{


        team2.forEach(b=>{


            addHistory(

                opponentHistory,

                a,

                b

            );


        });


    });


}
function makeRound(){


    let selected =


    [

    ...document.querySelectorAll(

    "#selectPlayers input:checked"

    )

    ]

    .map(

        x=>Number(x.value)

    );




    if(selected.length<4){


        alert("至少選4人");


        return;

    }





    if(todayPlayers.length===0){

        todayPlayers=selected;

    }




    let list =

    players.filter(

        p=>todayPlayers.includes(p.id)

    );




    let court =

    Number(

        document.getElementById("court").value

    );





    let available=[...list];


    let html="";


    lastMatches=[];





    for(let i=0;i<court;i++){



        if(available.length<4){

            break;

        }




        let group =

        selectPlayersForRound(

            available

        );




        available =

        available.filter(

            p=>!group.includes(p)

        );






        let teams =

        bestTeams(group);






        saveMatchHistory(

            teams[0],

            teams[1]

        );





        teams[0].concat(teams[1])

        .forEach(p=>{


            p.play++;

            p.consecutive++;


        });





        lastMatches.push({

            play:

            teams[0]

            .concat(teams[1])

            .map(p=>p.id)

        });







        html +=


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



        <br><br>


        實力：

        ${teamPower(teams[0])}

        VS

        ${teamPower(teams[1])}


        </div>


        `;



    }







    available.forEach(p=>{


        p.rest++;

        p.consecutive=0;


    });





    if(available.length){


        html +=


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

    .innerHTML=html;




    updateStatus();


    save();

}





function updateStatus(){


    let box=

    document.getElementById("status");



    if(!box){

        return;

    }



    let play=[];

    let rest=[];




    players.forEach(p=>{


        if(

        p.consecutive>0

        &&

        todayPlayers.includes(p.id)

        ){

            play.push(p.name);

        }

    });





    box.innerHTML=


    `

    第 ${roundNumber} 輪

    <br><br>

    上場：

    ${play.join("、")}


    `;


}






function nextRound(){


    if(!gameStarted){


        todayPlayers =


        [

        ...document.querySelectorAll(

        "#selectPlayers input:checked"

        )

        ]

        .map(

            x=>Number(x.value)

        );



        if(todayPlayers.length<4){

            alert("請選擇球友");

            return;

        }



        gameStarted=true;

        roundNumber=1;


    }

    else{


        roundNumber++;


    }



    makeRound();


}







function endToday(){



    if(!confirm(

        "確定結束今天球局？"

    )){

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





    document.getElementById("result")

    .innerHTML=

    "今日球局已結束";



    document.getElementById("status")

    .innerHTML=

    "尚未開始球局";



    save();


    render();


}






render();