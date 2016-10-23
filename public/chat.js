var Chat = Chat || {
  client: Client,
  latest_id: null,
  login: true,

  init: function(){
    $("#login").show();
    $("#logout").hide();
    this.client.load_init({
      success: function(data){
        window.debug = data;
        Chat.latest_id = data.messages[0].id;
        Chat.write_messages(data.messages);
        Chat.write_members(data.members);
        Chat.set_title(data.messages);
        Chat.load_latest();
      }
    });
  },

  logout_to_login: function(){
    Chat.login = true;
    $("#login").show();
    $("#logout").hide();
  },

  login_to_logout: function(){
    Chat.login = false;
    $("#chat_body_ul").empty();
    $("#login").hide();
    $("#logout").show();
  },

  exec_login: function(){
    var id = $("#login_id").val();
    var password = $("#login_password").val();
    this.client.login({
      id: id,
      password: password,
      success: function(data){
        if(data.result){
          Chat.init();
        }else{
          $("#login_form_message").text("ログインに失敗しました");
        }
      }
    });
  },

  exec_logout: function(){
    this.client.logout({
      success: function(data){
        Chat.login_to_logout();
      }
    });
  },

  load_latest: function(){
    this.client.load_latest({
      latest_id: this.latest_id,
      success: function(data){
        window.debug = data;
        var ul = $("#chat_body_ul");
        if(data.messages.length > 0){
          Chat.latest_id = data.messages[0].id;
        }
        Chat.write_messages(data.messages.reverse(), true);
        Chat.write_members(data.members);
        Chat.set_title(data.messages.reverse());
        if(Chat.login){
          Chat.load_latest();
        }
      }
    });
  },

  /*
   * 発言整形
   * obj: レスポンスのmessageオブジェクト
   */
  format_message: function(obj){
    var regexp = /https?:\/\/[^\s]*/g;
    var urls = obj.content.match(regexp);
    var texts = obj.content.split(regexp);
    var span = $("<span></span>");
    span.append("(" + obj.date + ")" + obj.name + "-->");
    if(!texts){ return span; }
    texts.forEach(function(text, i){
      span.append(text);
      if(urls && urls[i]){
        var url = urls[i];
        var favicon = $("<img>", {
          src: "http://favicon.hatena.ne.jp/?url=" + url
        });
        var a = $("<a></a>", {
          href: url,
          target: "_blank"
        });
        a.text(url);
        span.append(favicon);
        span.append(a);
        Chat.client.get_page_title({
          url: url,
          success: function(data){
            a.text(data.result);
          }
        });
      }
    });
    return span;
  },

  /*
   * 発言書き出し
   * messages: レスポンスのmessagesオブジェクト
   * prev: trueならprepend, falseならappend(デフォルト)
   */
  write_messages: function(messages, prev){
    var ul = $("#chat_body_ul");
    messages.forEach(function(obj){
      var li = $("<li></li>", {
        css: { color: obj.color }
      });
      li.html(Chat.format_message(obj));
      prev ? ul.prepend(li) : ul.append(li);
    });
  },

  /*
   * titleへのセット
   * messages: レスポンスのmessagesオブジェクト
   */
  set_title: function(messages){
    if(messages.length <= 0){ return; }
    var message = messages[0];
    var title = "(" + message.name + ")" + message.content;
    document.title = title;
  },

  /*
   * メンバー整形・書き出し
   * members: レスポンスのmembersオブジェクト
   */
  write_members: function(members){
    var ul = $("#members_ul");
    ul.empty();
    members.forEach(function(member){
      var li = $("<li></li>",{
        addClass: member.login == "login" ? "member_login" : "member_logout"
      });
      var icon = member.login == "login" ? "■" : "▽";
      var delay = $("<span></span>", { addClass: "delay_" + member.delay });
      delay.text(icon);
      var name = $("<span></span>");
      name.text(member.name + (member.status ? "@" + member.status : ""));
      li.append(delay);
      li.append(name);
      ul.append(li);
    });
  },

  create_message: function(){
    var message = $("#message").val();
    if(message.length <= 0){ return; }
    $("#message").val("");
    this.client.create_message({
      color: this.color,
      message: message,
      success: function(){}
    });
  },

  change_status: function(){
    var new_status = $("#status").val();
    this.client.change_status({
      status: new_status,
      success: function(){}
    });
  },

  create_judge: function(){
    var judge = $("#judge").val();
    if(judge.length <= 0){ return; }
    $("#judge").val("");
    this.client.create_judge({
      message: judge,
      success: function(){}
    });
  },

  create_auto: function(){
    this.client.create_auto({
      success: function(){}
    });
  },

  set_form_action: function(){
    $("#login_form").submit(function(){
      Chat.exec_login();
      return false;
    });
    $("#message_form").submit(function(){
      Chat.create_message();
      return false;
    });
    $("#status_form").submit(function(){
      Chat.change_status();
      return false;
    });
    $("#judge_form").submit(function(){
      Chat.create_judge();
      return false;
    });
    $("#auto_form").submit(function(){
      Chat.create_auto();
      return false;
    });
    $("#logout_form").submit(function(){
      Chat.exec_logout();
      return false;
    });
  },

  set_color_form: function(current_color){
    var div = $("#color_select");
    var colors = ["000000", "808080", "800000", "808000", "008000", "008080", "000080", "800080", "FF00FF", "FF6600"];
    this.color = current_color;
    colors.forEach(function(color){
      var span = $("<span></span>", {
        css: { color: "#" + color },
        addClass: "color_select_color" + (color == current_color ? " selected" : ""),
        on: {
          click: function(){
            Chat.set_color(color);
            $(this).nextAll().removeClass("selected");
            $(this).prevAll().removeClass("selected");
            $(this).addClass("selected");
          }
        }
      });
      span.text("■");
      div.append(span);
    });
  },

  set_color: function(color){
    this.color = color;
    $.cookie("color", color, { expires: 360 });
  }
}

$(document).ready(function(){
  Chat.set_form_action();
  Chat.set_color_form($.cookie("color"));
  Chat.init();
});