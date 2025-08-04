"use strict";
//renderで動作するために追加
const BASE_URL = location.hostname === "localhost"
    ? "http://localhost:8001"
    : "https://mongo-money-api.onrender.com"


// フロントエンドのコード

// const { Server } = require("http");

//円グラフのモジュールの読み込み
const canvas = document.getElementById("pieChart");
const ctx = canvas.getContext("2d");

function pie (dataArray) {//円グラフの内部数値の設定

    //円グラフの描画
    
    // const dataArray = [30,70,45,55];
    const colors = ["red", "blue", "green", "orange","yellow","gray","brown","purple","indigo","khaki"];
    const total = dataArray.reduce((a,b) => a + b);
    console.log(total);
    let starAngle = 0;
    
    dataArray.forEach((value,index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;//要素ごとの円周の長さの計算

        ctx.beginPath();
        ctx.moveTo(150,150);
        ctx.arc(150, 150, 100, starAngle, starAngle + sliceAngle);
        ctx.closePath();
    
        ctx.fillStyle = colors[index];
        ctx.fill();
    
        starAngle += sliceAngle;
    });
}

//日付のデータの取得
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth()+1;
const weeks = now.getDay();
const week = ["日","月","火","水","木","金","土"][weeks];
const day = now.getDate();

document.getElementById("nowMonth").textContent = month;
document.getElementById("nowDate").textContent = day;
document.getElementById("nowWeek").textContent = week;
document.getElementById("table_month_span").textContent = month;

console.log(weeks);
console.log(week);
console.log(day);


//送信ボタンを押すと直近の買い物の金額を取得
const send_expend = document.getElementById("send_expenditure");

let expendData = null;
let incomeData = null;

send_expend.addEventListener("click",(e)=>{
    //押すたびに値を変えるのならイベント内で定義すること
    const now_expend = document.getElementById("now_expenditure").value;//出費額
    const typeOfExpenditure = document.getElementById("type_of_expenditure").value;//出費のタイプ
    const remark = document.getElementById("remark").value;//備考欄の取得
    console.log(now_expend);
    console.log(typeOfExpenditure);

    expendData = {
        mode : "expend",
        expend : now_expend,
        type : typeOfExpenditure,
        remark : remark
    }

    console.log(expendData);
    send(expendData).then(()=>{
        receive();
    });
});

//直近の収入をsendボタンを押したら取得する

document.getElementById("send_income").addEventListener("click" ,(e) => {
    const nowIncome = document.getElementById("now_income").value;
    console.log(nowIncome);
    incomeData = {
        mode : "income",
        income : nowIncome
    }
    console.log(incomeData);
    send(incomeData).then(()=> {
        receive();
    });
});

function send (data) {  //ポート8001にデータを送信する
    console.log(`関数send内のdata:${data}`)
    return fetch(`${BASE_URL}/`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(res => res.text())
    .then(res => console.log("送信結果：",res))
    .catch(err => console.log("送信エラー：",err));

}

function receive () {//情報の受け取りと値の成型と貼り付け GAS側でやっていたデータの集計などをフロントでする

    fetch(`${BASE_URL}/relay`)//開けたポートのurlを代入する
    .then(res => res.json())
    .then(data => {
        console.log("受け取りデータ：", data);
        console.log("受け取りデータの型：", typeof(data) );
        // console.log("受け取りデータ：", data.expendType);
        // console.log("受け取りデータ：", data.expendDataObjArray);

        const now = new Date();
        let totalToday = 0, totalWeek = 0, totalMonth = 0;
        let hourlyExpend = 0, hourlyExpendMonty = 0;
        const typeMap = {};
        const objArray = [];

        data.forEach(entry => {
            const date = new Date(entry.date);
            const amount = Number(entry.amount || 0);
            const type = entry.type;
            
            if(!typeMap[type]) typeMap[type] = 0;
            typeMap[type] += amount;
            objArray.push({ type, price: amount, color: randomColorFor(type)});

            if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
                totalMonth += amount; //今月の集計

                if(date.toDateString() === now.toDateString()) {
                    totalToday += amount; //今日の集計
                }

                //今週の集計
                // const sunday = new Date().setDate();
                // console.log(sunday);
            }
            
        });

        //時給換算の計算

        hourlyExpend = totalToday / 24;
        hourlyExpendMonty = totalMonth / now.getDay() / 24;

        document.getElementById("hourly_wage").textContent = hourlyExpend;
        document.getElementById("hourly_wage_month").textContent = hourlyExpendMonty;
        document.getElementById("today_expense").textContent = totalToday;
        document.getElementById("week_expense").textContent = totalWeek;
        document.getElementById("month_expense").textContent = totalMonth;
        
        //テーブルに支出の値を記入する
        let typeArray = ["investment","waste_expense","necessities","eating_out","delivery","book","teaching_material","convenience","food","other"];
        let i = 0;
        for(let key in data) {

            document.getElementById(`${typeArray[i]}`).textContent = data.expendType[key]
            i++;
        }
        
        let expendArray = [];
        let count = 0;
        for(let expend in data.expendType){
            // console.log(data.expendType[expend]);
            expendArray.push(data.expendType[expend]);
            count++
        };

        let newArray = [];
        let colorArray = [];
        for(let obj of data.expendDataObjArray) {//色とタイプが固定するように配列を作る
            console.log(obj);
            colorArray.push(obj.color);
            newArray.push([obj.type,obj.price,obj.color]);
        }
        console.log(colorArray);
        console.log(newArray);
        // pie(expendArray);
        pieObjArray(data.expendDataObjArray);

    })
    .catch(err => console.error("取得失敗：",err));
}

function pieObjArray (objArray) {
    const filteredData = objArray.filter(obj => obj.price > 0);//priceがゼロのカテゴリーを排除
    const sortedData = filteredData.sort((a,b) => b.price - a.price);

    const total = sortedData.reduce((sum, obj) => sum + obj.price, 0);//reduce((累積地,要素) => 処理,初期値)　これで全体の合計値を算出する。

    let starAngle = -0.5 * Math.PI;//12時方向を描画のスタート地点にする
    ctx.clearRect( 0, 0, canvas.width, canvas.height);//前のグラフをクリアする。

    sortedData.forEach(obj => {
        const sliceAngle = (obj.price / total) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(150,150);//円の中心へ移動
        ctx.arc(
            150,        //中心X
            150,        //中心Y
            100,        //半径
            starAngle,  //描画の開始角度
            starAngle + sliceAngle//描画の終了角度
        );
        ctx.closePath();

        ctx.fillStyle = obj.color;//カテゴリの色の取得
        ctx.fill();//塗りつぶしコマンド

        starAngle += sliceAngle;
    });

    //凡例の描画
    let legendX = 300;
    let legendY = 50;
    const legendBoxSize = 20;

    ctx.font = "14px sans-serif";
    filteredData.forEach(obj => {
        
        console.log("test")
        ctx.fillStyle = obj.color;
        ctx.fillRect(legendX,legendY,legendBoxSize,legendBoxSize);

        ctx.fillStyle = "black";
        ctx.fillText(`${obj.type}(${obj.price}円)`, legendX + legendBoxSize + 5, legendY + 15);
        
        legendY += 30;
    
    });

}

function randomColorFor(type) {
    const colorMap = {
        "投資": "#3366CC",
        "浪費": "#DC3912",
        "日用品": "",
        "外食": "",
        "出前": "",
        "本": "",
        "教材": "",
        "コンビニ": "",
        "食品": "",
        "その他": ""
    };

    return colorMap[type];
}

function convertIdToType(id) {
    const map = {
        investment: "投資",
        waste_expense: "浪費",
        necessities: "日用品",
        eating_out: "外食",
        delivery: "出前",
        book: "本",
        teaching_material: "教材",
        convenience: "コンビニ",
        food: "食品",
        other: "その他",
    };

    return map[id];
}

receive();