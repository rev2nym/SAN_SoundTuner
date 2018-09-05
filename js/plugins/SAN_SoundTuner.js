//=============================================================================
// SAN_SoundTuner.js
//=============================================================================
// Copyright (c) 2016 Sanshiro
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc サウンドチューナー 1.0.0
 * 音声ファイル毎に相対音量、ピッチ、位相を設定します。
 * @author サンシロ https://twitter.com/rev2nym
 * @version 1.0.0 2016/11/23 公開。
 * @help
 * ■概要
 * 音声ファイル毎に相対音量、ピッチ、位相を設定します。
 * 設定は追加データベースファイルに記述します。
 * 
 * ■追加データベースファイル
 * このプラグインは追加のデータベースファイルを使用します。
 * 追加データベースファイルはプラグインと併せて公開されます。
 * 追加データベースファイルは次のJSONファイルです。
 * 
 *   SAN_SoundTuner.json
 * 
 * プロジェクトのdataフォルダ内に上記のJSONファイルを配置してください。
 * 
 * ■設定の書式
 * 追加データベースファイルにはJSONファイルの記法に則り
 * 次の書式で設定を記述してください。
 * 
 * { "settings": [
 *   { "type":"bgm", "name":"Battle1",   "volume":100, "pitch":100, "pan":0 },
 *   { "type":"bgm", "name":"Ship1",     "volume":100, "pitch":100, "pan":0 },
 *   { "type":"bgs", "name":"City",      "volume":100, "pitch":100, "pan":0 },
 *   { "type":"bgs", "name":"Darkenss",  "volume":100, "pitch":100, "pan":0 },
 *   { "type":"me",  "name":"Victory1",  "volume":100, "pitch":100, "pan":0 },
 *   { "type":"me",  "name":"Gameover1", "volume":100, "pitch":100, "pan":0 },
 *   { "type":"se",  "name":"Cursor2",   "volume":100, "pitch":100, "pan":0 },
 *   ...
 *   { "type":"se",  "name":"Item3",     "volume":100, "pitch":100, "pan":0 }
 * ] }
 * 
 * "type"   : 音声タイプです。"bgm", "bgs", "me", "se"が有効です。
 * "name"   : 音声ファイル名称です。
 * "volume" : 相対音量です。数値を設定してください。
 *            本来のSE音量に相対音量[%]を乗じた音量で再生されます。
 *              例 本来音量80で相対音量90の場合
 *                   80*(90/100)=72
 *                 となり音量72で再生されます。
 *            設定適用後の音量は0～100の範囲で有効です。
 *            範囲外の場合は自動で調整されます。
 *            省略可。省略した際は音声設定に影響しません。
 * "pitch"  : ピッチです。数値を設定してください。
 *            50～150の範囲で有効です。
 *            範囲外の場合は自動で調整されます。
 *            省略可。省略した際は音声設定に影響しません。
 * "pan"    : 位相です。数値を設定してください。
 *            -100～100の範囲で有効です。
 *            範囲外の場合は自動で調整されます。
 *            省略可。省略した際は音声設定に影響しません。
 * 
 * ■利用規約
 * MITライセンスのもと、商用利用、改変、再配布が可能です。
 * ただし冒頭のコメントは削除や改変をしないでください。
 * よかったらクレジットに作者名を記載してください。
 * 
 * これを利用したことによるいかなる損害にも作者は責任を負いません。
 * サポートは期待しないでください＞＜。
 */

var Imported = Imported || {};
Imported.SAN_SoundTuner = true;

var Sanshiro = Sanshiro || {};
Sanshiro.SoundTuner = Sanshiro.SoundTuner || {};
Sanshiro.SoundTuner.version = '1.0.0';

(function(SAN) {
'use strict';

//-----------------------------------------------------------------------------
// DataManager
//
// データマネージャー

// データベースファイルの追加
DataManager._databaseFiles.push(
    { name: '$dataSoundTuner', src: 'SAN_SoundTuner.json' }
);

// サウンドセッティングオブジェクト
var $soundTuner = null;

// ゲームオブジェクトの作成
var _DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
    _DataManager_createGameObjects.call(this);
    $soundTuner = new SoundTuner();
};

//-----------------------------------------------------------------------------
// AudioManager
//
// オーディオマネージャー

// BGMの再生
var _AudioManager_playBgm = AudioManager.playBgm;
AudioManager.playBgm = function(bgm, pos) {
    bgm = this.applyParameterSoundTuner('bgm', bgm);
    _AudioManager_playBgm.call(this, bgm, pos);
};

// BGSの再生
var _AudioManager_playBgs = AudioManager.playBgs;
AudioManager.playBgs = function(bgs, pos) {
    bgs = this.applyParameterSoundTuner('bgs', bgs);
    _AudioManager_playBgs.call(this, bgs, pos);
};

// MEの再生
var _AudioManager_playMe = AudioManager.playMe;
AudioManager.playMe = function(me) {
    me = this.applyParameterSoundTuner('me', me);
    _AudioManager_playMe.call(this, me);
};

// SEの再生
var _AudioManager_playSe = AudioManager.playSe;
AudioManager.playSe = function(se) {
    se = this.applyParameterSoundTuner('se', se);
    _AudioManager_playSe.call(this, se);
};

// 固定SEの再生
var _AudioManager_playStaticSe = AudioManager.playStaticSe;
AudioManager.playStaticSe = function(se) {
    se = this.applyParameterSoundTuner('se', se);
    _AudioManager_playStaticSe.call(this, se)
};

// サウンド設定適用後のパラメータ
AudioManager.applyParameterSoundTuner = function(type, parameter) {
    var setting = $soundTuner.setting(type, parameter.name);
    if (!setting) { return parameter; }
    var newParameter = {};
    for (var key in parameter) {
        newParameter[key] = parameter[key];
    }
    if (setting.volume !== undefined) {
        var volume = newParameter.volume * (setting.volume / 100);
        newParameter.volume = Math.floor(volume).clamp(0, 100);
    }
    if (setting.pitch !== undefined) {
        var pitch = setting.pitch;
        newParameter.pitch = Math.floor(pitch).clamp(50, 150);
    }
    if (setting.pan !== undefined) {
        var pan = setting.pan;
        newParameter.pan = Math.floor(pan).clamp(-100, 100);
    }
    return newParameter;
};

//-----------------------------------------------------------------------------
// SoundTuner
//
// サウンドセッティング

function SoundTuner() {
    this.initialize.apply(this, arguments);
}

// オブジェクト初期化
SoundTuner.prototype.initialize = function() {
    this.initMembers();
};

// メンバー変数の初期化
SoundTuner.prototype.initMembers = function() {
    this._data = {};
    $dataSoundTuner.settings.forEach(function(setting) {
        var type = setting.type;
        var name = setting.name;
        var parameter = {
            volume: setting.volume,
            pitch:  setting.pitch,
            pan:    setting.pan
        };
        if (!this._data[type]) {
            this._data[type] = {};
        };
        this._data[type][name] = parameter;
    }, this);
};

// セッティングの取得
SoundTuner.prototype.setting = function(type, name) {
    return !!name ? this._data[type][name] : undefined;
};

}) (Sanshiro);
