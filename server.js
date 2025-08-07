"use strict";
//モジュールの呼び出しと、インスタンス化
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const path = require("path");
const { timeStamp } = require("console");

require("dotenv").config();
const mongoURL = process.env.MONGO_URI;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,"public")));

//MongoDB


mongoose.connect(mongoURL/*, { useNewUrlParser:true, useUnifiedTopology:true}*/)
    .then(() => console.log("MongoDBに接続成功"))
    .catch(err => console.error("MongoDB接続失敗:",err));

//スキーマとモデルの定義 ！！！ここで保存される形を定義している！！！
const expenseSchema = new mongoose.Schema({
    user : String,
    date: {type: Date, default: Date.now },
    expend : Number,
    mode : String,
    type: String,
    remark: String,
    timeStamp: Date
});
const Expense = mongoose.model("Expense", expenseSchema);

//データ受け取り・保存
app.post("/", async (req, res) => {
    try {
        const { user,timeStamp, mode, expend, type, remark} = req.body;//type expendを分割代入
        // console.log(req);
        console.log("req.body : " ,req.body);
        const newExpense = new Expense({
            // date,
            user,
            mode,
            timeStamp,
            expend,
            type, 
            remark, 
        });//mongoDBに保存するために、専用のオブジェクトを作っている
        console.log(`newExpense : ${newExpense}`);
        await newExpense.save();
        res.send("保存成功");
    } catch (err) {
        console.error("保存エラー：", err);
        console.error("保存エラー：", req.body);
        res.status(500).send("保存失敗");
    }
});

// データ取得
app.get("/relay", async (req, res) => {
    try {
        const {user} = req.body;
        const filter = user ? { user } : {};

        const expenses = await Expense.find(filter).sort({date: -1}).limit(100);
        res.json({
            expendDataObjectArray: expenses
        });
    } catch (err) {
        console.error("取得エラー：", err);
        res.status(500).send("取得失敗");
    }
})

// サーバの起動
app.listen(8001, () => {
    console.log("MongoDB対応サーバ稼働中：ポート8001");
});




