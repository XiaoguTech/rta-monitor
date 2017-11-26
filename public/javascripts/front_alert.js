function formatTime(datetime){
    var time=new Date(datetime);
    return time.getFullYear()+
    "-"+((time.getMonth()+1).toString().length>1?(time.getMonth()+1):"0"+(time.getMonth()+1))+
    "-"+((time.getDate()).toString().length>1?time.getDate():"0"+time.getDate())+
    " "+((time.getHours()).toString().length>1?time.getHours():"0"+time.getHours())+
    ":"+((time.getMinutes()).toString().length>1?time.getMinutes():"0"+time.getMinutes())+
    ":"+((time.getSeconds()).toString().length>1?time.getSeconds():"0"+time.getSeconds());
}
$('.ui.dropdown').dropdown();
$('.ui.accordion').accordion();
$('#refreshButton').click(function(){
    $('#alertNewMessage').addClass('hidden');
    $('#alertLoadingMessage').removeClass('hidden');
    $.ajax({
        url:window.location.href+"/refresh",
        success:function(data){
            updateTable(JSON.stringify(data));
            setTimeout(function(){$('#alertLoadingMessage').addClass('hidden');},1000);  
            setTimeout(function(){$('#alertSuccessMessage').removeClass('hidden');},1000);
            setTimeout(function(){$('#alertSuccessMessage').addClass('hidden')},2000);         
        },
        error:function(){
            setTimeout(function(){$('#alertLoadingMessage').addClass('hidden');},1000);  
            setTimeout(function(){$("#alertErrorMessage").removeClass("hidden");},1000);  
            setTimeout(function(){$('#alertErrorMessage').addClass('hidden');},2500);
        }
    });
});

function updateTable(data){
    var jsonObj=JSON.parse(data);
    var alertArray=jsonObj.alertArray;    
    $("#alertTableList").html("");
    var tbody=$("<tbody></tbody>");
    for(var obj in alertArray){
        var tr=$("<tr></tr>");
        tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
        tr.append($("<td></td>").append($("<a href='/api/solution?alertID="+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
        tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
        tr.append($("<td></td>").append(alertArray[obj].message));
        tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
        tbody.append(tr);
    }
    $("#alertLatestMessage").html(jsonObj.latestMessage);
    $("#alertFormatTime").html(formatTime(jsonObj.latestTime));
    $("#alertTableList").append(tbody); 
    $("#timestamp").html(jsonObj.latestTime);
}
$(function(){
    $.ajax({
        url:window.location.href+"/refresh",
        success:function(data){
            updateTable(JSON.stringify(data));
            setTimeout(function(){$('#alertLoadingMessage').addClass('hidden');},1000);
        },
        error:function(){
            setTimeout(function(){$('#alertLoadingMessage').addClass('hidden');},1000);
            setTimeout(function(){$("#alertErrorMessage").removeClass("hidden");},1000);
            setTimeout(function(){$('#alertErrorMessage').addClass('hidden');},2500);
        }
    });
    setInterval(function(){
        var timestamp=$("#timestamp").html();
        $.ajax({
            url:window.location.href+"/getLatestMessage?timestamp="+timestamp,
            success:function(result){
                if(result.iNewNum!=undefined){
                    if(result.iNewNum){
                        $("#alertNewMessageNum").html(result.iNewNum);
                        $('#alertNewMessage').removeClass('hidden');
                        $("#alertLatestMessage").html(result.sMessage);
                        $("#alertFormatTime").html(formatTime(result.sTime));
                    }
                }
                else if(result.message=="not found"){
                    $("#alertNewMessageNum").html("99+");
                    $('#alertNewMessage').removeClass('hidden');
                    if(result.sMessage!=undefined){
                        $("#alertLatestMessage").html(result.sMessage);
                        $("#alertFormatTime").html(formatTime(result.sTime));
                    }
                }
            }
        });
    },5000);
});