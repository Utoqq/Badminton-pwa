let players =
JSON.parse(localStorage.getItem("players")) || [];


let todayPlayers = [];


let lastRound = [];


let lastPlayed = [];


let teamHistory = {};


let gameStarted = false;


let roundNumber = 0;




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




function render(){


    let box =
    document.getElementById("players");


    let select =
    document.getElementById("selectPlayers");



    box.innerHTML="";

    select.innerHTML="";





    let showPlayers=[...players];


    showPlayers.sort((a,b)=>{


        if(a.play!==b.play){

            return a.play-b.play;

        }


        return b.rest-a.rest;


    });





    showPlayers.forEach(p=>{


        box.innerHTML +=

        `

        <div class="player">


        <div style="
        font-size:22px;
        font-weight:bold;
        ">

        ${p.name}

        </div>



        <div>

        能力值：
        ${p.level}

        </div>



        <div style="
        margin-top:8px;
        color:#555;
        ">


        上場 ${p.play} 場　

        休息 ${p.rest} 場


        </div>




        <div>


        <button class="edit"
        onclick="editPlayer(${p.id})">

        修改

        </button>



        <button class="delete"
        onclick="deletePlayer(${p.id})">

        刪除

        </button>



        </div>


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

        p.level=Number(level);

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







function teamScore(team){


    return team.reduce(

        (sum,p)=>sum+p.level,

        0

    );


}






function pairKey(a,b){


    return a.id<b.id

    ?

    a.id+"-"+b.id

    :

    b.id+"-"+a.id;


}







function teammateCount(a,b){


    return teamHistory[
        pairKey(a,b)
    ] || 0;


}







function addTeamHistory(team){


    for(let i=0;i<team.length;i++){


        for(let j=i+1;j<team.length;j++){


            let key =
            pairKey(
                team[i],
                team[j]
            );


            teamHistory[key]
            =
            (teamHistory[key]||0)+1;


        }

    }

}







function splitTeams(group){


    let choices=[


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



    let best=null;

    let bestScore=999;



    choices.forEach(c=>{


        let power =
        Math.abs(
            teamScore(c[0])
            -
            teamScore(c[1])
        );



        let repeat =
        teammateCount(
            c[0][0],
            c[0][1]
        )
        +
        teammateCount(
            c[1][0],
            c[1][1]
        );



        let score =
        power + repeat*5;



        if(score<bestScore){


            bestScore=score;

            best=c;


        }


    });



    return best;


}







function choosePlayers(list){


    let arr=[...list];


    arr.sort((a,b)=>{


        let A =
        a.rest*5
        -
        a.play*2
        -
        a.consecutive*8
        -
        (lastPlayed.includes(a.id)?10:0);



        let B =
        b.rest*5
        -
        b.play*2
        -
        b.consecutive*8
        -
        (lastPlayed.includes(b.id)?10:0);



        return B-A;


    });



    return arr.slice(0,4);


}







function updateStatus(){


    let box =
    document.getElementById("status");



    if(!gameStarted){


        box.innerHTML =
        "尚未開始球局";


        return;

    }





    let play=[];

    let rest=[];




    lastRound.forEach(r=>{


        let p =
        players.find(
            x=>x.id===r.id
        );



        if(p){


            if(r.play){

                play.push(p.name);

            }
            else{

                rest.push(p.name);

            }

        }


    });





    box.innerHTML =


    `

    第 ${roundNumber} 輪


    <br><br>


    上場：

    ${play.join("、") || "無"}


    <br>


    休息：

    ${rest.join("、") || "無"}


    `;



}
function makeGroup(){


    if(todayPlayers.length===0){


        todayPlayers =
        [
            ...document.querySelectorAll(
            "#selectPlayers input:checked"
            )
        ]
        .map(
            x=>Number(x.value)
        );


    }




    let list =
    players.filter(
        p=>todayPlayers.includes(p.id)
    );



    if(list.length<4){


        document.getElementById("result")
        .innerHTML =
        "至少需要4人";


        return;


    }





    let court =
    Number(
        document.getElementById("court").value
    );



    let available=[...list];


    let html="";



    lastRound=[];

    lastPlayed=[];




    for(let i=0;i<court;i++){


        if(available.length<4){

            break;

        }



        let group =
        choosePlayers(available);



        available =
        available.filter(
            p=>!group.includes(p)
        );



        let teams =
        splitTeams(group);




        addTeamHistory(group);




        group.forEach(p=>{


            lastRound.push({

                id:p.id,

                play:true

            });



            lastPlayed.push(p.id);


        });





        html +=


        `

        <div class="match">


        第 ${i+1} 號場


        <br><br>



        ${teams[0][0].name}

        +

        ${teams[0][1].name}



        <br>


        VS


        <br>



        ${teams[1][0].name}

        +

        ${teams[1][1].name}



        <br><br>


        實力：

        ${teamScore(teams[0])}

        VS

        ${teamScore(teams[1])}


        </div>


        `;



    }






    available.forEach(p=>{


        lastRound.push({

            id:p.id,

            play:false

        });


    });






    if(available.length){


        html +=


        `

        <div class="match">


        休息：

        ${
        available.map(
            p=>p.name
        ).join("、")
        }


        </div>


        `;


    }




    document.getElementById("result")
    .innerHTML=html;



    updateStatus();


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


            alert("請先選擇至少4人");


            return;


        }




        gameStarted=true;

        roundNumber=1;



        makeGroup();


        return;


    }






    lastRound.forEach(r=>{


        let p =
        players.find(
            x=>x.id===r.id
        );



        if(p){



            if(r.play){


                p.play++;

                p.consecutive++;


            }
            else{


                p.rest++;

                p.consecutive=0;


            }


        }



    });





    save();



    roundNumber++;



    makeGroup();



    render();



}









function endToday(){


    if(!confirm(
        "確定結束今天球局？"
    )){


        return;


    }





    todayPlayers=[];


    lastRound=[];


    lastPlayed=[];


    teamHistory={};


    gameStarted=false;


    roundNumber=0;





    players.forEach(p=>{


        p.play=0;


        p.rest=0;


        p.consecutive=0;


    });





    save();





    document.getElementById("result")
    .innerHTML=
    "今日球局已結束";



    document.getElementById("status")
    .innerHTML=
    "尚未開始球局";



    render();



}





render();