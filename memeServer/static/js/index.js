var base_url = ""
var graphed;
var page;
var portfolio_list;

function is_authenticated(){
    var portfolio = $("#account-info");
    if (portfolio.length > 0)
        return true;
    return false;
}

function get_view(){
    var market = $("#market");
    if (market.length > 0)
        return "market"
    return "portfolio"
}

function get_portolio_amount(name){
    //TODO
}

function board_display(meme){
    $("#selected-stock").text(meme);
    $.get('/api/stock', {meme:meme}, function(data){
        $("#selected-price").text("Price: $" + data['price']);
        $("#selected-trend").empty().text("Trend: ").append(trend_symbol(data['trend']));
        $("#selected-link").attr("href", "/stock/" + data['_id']['$oid']);
    });
    graphed = meme;
    graph(meme, base_url);
}

function tableCreate(el, data, query)
{
    el.empty();
    var tbl  = document.createElement("table");
    
    if (data.length >= 1){
        var trh = tbl.insertRow();
        var th_amount = trh.insertCell();
        th_amount.appendChild(document.createTextNode('#'));
        var th_price = trh.insertCell();
        th_price.appendChild(document.createTextNode('price'));
        var th_trend = trh.insertCell();
        th_trend.appendChild(document.createTextNode('trend'));
        var th_name = trh.insertCell();
        th_name.appendChild(document.createTextNode('name'));
        trh.setAttribute('class', 'economy-header');
    } else {
        //prompt to "add new"
        var newtext = "Meme not found.";
        if (is_authenticated())
            newtext+="Buy ONE.";

        var trh = tbl.insertRow();
        var th_new = trh.insertCell();
        th_new.appendChild(document.createTextNode(newtext));
        th_new.setAttribute('id', 'create-meme');
    }

    for (var i = 0; i < data.length; ++i)
    {
        var tr = tbl.insertRow();
        tr.setAttribute("class", "economy");

        var td_amount = tr.insertCell();
        if ('amount' in data[i]){
            if (data[i]['amount'] == 0)
                break;
            td_amount.appendChild(document.createTextNode(data[i]['amount']));
        } else {
            // TODO get_portfolio_amount()
            td_amount.appendChild(document.createTextNode('.'));
        }

        var td_price = tr.insertCell();
        td_price.appendChild(document.createTextNode('$' + data[i]['price']));

        var td_trend = tr.insertCell();
        td_trend.appendChild(data[i]['trend'] 
            ? trend_symbol(data[i]['trend']) 
            : document.createTextNode(""));

        var td_value = tr.insertCell();
        td_value.appendChild(document.createTextNode(data[i]['name']));
        td_value.setAttribute('class', 'meme-name');
    }
    el.append(tbl);
    
    $('td.meme-name').click(function() {
        if (is_authenticated())
            document.getElementById("meme").value = this.innerText;
        board_display(this.innerText);
    });
    if (is_authenticated()){
        $("#create-meme").click(function(){
            board_display(query);
            buy();
        });
    }
}

function updateAccount(holdings, money){
    $("#account-money").text("$"+money);
    $("#account-holdings").text("$"+holdings);
}

function updateMarket(){
    $.getJSON(base_url+'/api/stocks',{page:page}, function(data) {
        if (graphed === undefined)
            board_display(data[0]['name']);
        var market = $("#jsonM");
        market.empty();
        tableCreate(market, data);
        oldData = data;
    });
}

function updatePortfolio(meme) {
    // Called, among other things, when buy and sell are clicked.
    if (is_authenticated()){
        $.getJSON(base_url+'/api/me', function(data) {
            portfolio_list = data['stocks'];
            updateAccount(data['stock_value'], data['money']);
            //update table on portfolio page.
            tableCreate($("#jsonM"), data['stocks']);           
        });
    }
}

function update(meme){
    // Decide what to do depending on what view we are in....
    if (is_authenticated() && get_view() == "portfolio")
        updatePortfolio();
    else
        updateMarket();
    if (meme)
        board_display(meme);
}

function sell() {
    var meme = $("#selected-stock").text();
    $.get(base_url+"/api/sell", {meme: meme}, function(){
        update(meme);
    });
}

function buy() {
    var meme = $("#selected-stock").text();
    $.get(base_url+"/api/buy", {meme: meme}, function(){
        update(meme);
    });
}

function remove(){
    var meme = $("#selected-stock").text();
    /* Admin only. Don't bother, the backend will check your permissions */
    $.get(base_url+"/api/admin/stock/delete", {meme: meme}, function(){
        update(meme);
    });
}

function search(){
    var query = document.getElementById("meme").value;
    $.getJSON(base_url+"/api/search", {q:query}, function(data){
        var elem = $("#search-results-table");
        elem.empty();
        tableCreate(elem, data, query);
    })
}

function init(){
    var active = $("#selected-stock").text();
    if (active != '') // TODO: Slight hack...  Maybe I can do this better.
        board_display(active);
    page = $("#pagenumber").text();
    update();
    setInterval(update, 3000);
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? false : sParameterName[1];
        }
    }
};

function trend_symbol(num) {
    var span = document.createElement('span');
    if (num > 0){
        span.innerHTML = '⬆';
        span.className = 'trend_up'
    }
    else{
        span.innerHTML = '⬇';
        span.className = 'trend_down'
    }
    return span;
}

// Entry point

window.onload = init;
