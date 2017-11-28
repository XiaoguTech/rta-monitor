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
$('#alertRefreshButton').click(function(){
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
    if(jsonObj.alertArray==undefined){
        $("#timestamp").html("1901-01-01T00:00:00.635294222Z");
        return;
    }
    
    var alertArray=jsonObj.alertArray; 
    var alertCount=alertArray.length;//记录条数
    var pageSize=10;//每页显示条数
    var pageCount=Math.ceil(alertCount/pageSize);//计算总页数 
    var currentPage =1;//当前页，默认为1。 
    //造个简单的分页按钮  
    $('#alertPageContainer').html("");  
    $('#alertPageSelect').html("");
    for(var i=1;i<=pageCount;i++){  
        var pageNode="<a href='javascript:' class='alertPageNum' selectPage='"+i+"'>"+i+"</a>";
        var optionNode="<option selectPage='"+i+"'>"+i+"</option>";
        $('#alertPageContainer').append(pageNode);  
        $('#alertPageSelect').append(optionNode);
    }  

    
    //显示默认页（第一页）  
    $("#alertTableList").html("");
    var tbody=$("<tbody></tbody>");
    if(pageCount!=1){
        for(obj=(currentPage-1)*pageSize;obj<pageSize*currentPage;obj++){    
            var tr=$("<tr></tr>");
            tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
            tr.append($("<td></td>").append($("<a href='/api/solution/"+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
            tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
            tr.append($("<td></td>").append(alertArray[obj].message));
            tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
            tbody.append(tr); 
        }  
    }else{
        for(obj=(currentPage-1)*pageSize;obj<alertCount;obj++){    
            var tr=$("<tr></tr>");
            tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
            tr.append($("<td></td>").append($("<a href='/api/solution/"+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
            tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
            tr.append($("<td></td>").append(alertArray[obj].message));
            tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
            tbody.append(tr); 
        }  
    }

    $("#alertTableList").append(tbody); 
    


    //显示选择页的内容  
    $('.alertPageNum').click(function(){  
        var selectPage=$(this).attr('selectPage');
        $("#alertTableList").html("");
        var tbody=$("<tbody></tbody>");
        if(selectPage!=pageCount){
            for(obj=(selectPage-1)*pageSize;obj<pageSize*selectPage;obj++){  
                var tr=$("<tr></tr>");
                tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
                tr.append($("<td></td>").append($("<a href='/api/solution/"+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
                tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
                tr.append($("<td></td>").append(alertArray[obj].message));
                tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
                tbody.append(tr);        
            }
        }
        else{
            for(obj=(selectPage-1)*pageSize;obj<alertCount;obj++){  
                var tr=$("<tr></tr>");
                tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
                tr.append($("<td></td>").append($("<a href='/api/solution/"+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
                tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
                tr.append($("<td></td>").append(alertArray[obj].message));
                tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
                tbody.append(tr);        
            }
        }
        $("#alertTableList").append(tbody); 
    }); 
   
    $('#alertPageSelect').change(function(){
        var selectPage=$(this).children('option:selected').val();
        $("#alertTableList").html("");
        var tbody=$("<tbody></tbody>");
        if(selectPage!=pageCount){
            for(obj=(selectPage-1)*pageSize;obj<pageSize*selectPage;obj++){  
                var tr=$("<tr></tr>");
                tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
                tr.append($("<td></td>").append($("<a href='/api/solution/"+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
                tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
                tr.append($("<td></td>").append(alertArray[obj].message));
                tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
                tbody.append(tr);        
            }
        }
        else{
            for(obj=(selectPage-1)*pageSize;obj<alertCount;obj++){  
                var tr=$("<tr></tr>");
                tr.append($("<td></td>").append("<label class='ui red empty circular label'></label>"));
                tr.append($("<td></td>").append($("<a href='/api/solution/"+alertArray[obj].alertID+"' target='_blank'>"+alertArray[obj].alertID+"</a>")));
                tr.append($("<td></td>").append(formatTime(alertArray[obj].time)));
                tr.append($("<td></td>").append(alertArray[obj].message));
                tr.append($("<td></td>").append(alertArray[obj].value.toFixed(3))); 
                tbody.append(tr);        
            }
        }
        $("#alertTableList").append(tbody); 
    })


    $("#alertLatestMessage").html(jsonObj.latestMessage);
    $("#alertFormatTime").html(formatTime(jsonObj.latestTime));
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
                var tableLength = document.getElementsByTagName('tbody')[0].getElementsByTagName('tr').length;   
                console.log(tableLength);     
                if(result.iNewNum!=undefined){
                    if(result.iNewNum){
                        $("#alertNewMessageNum").html(result.iNewNum);
                        $('#alertNewMessage').removeClass('hidden');
                        $("#alertLatestMessage").html(result.sMessage);
                        $("#alertFormatTime").html(formatTime(result.sTime));
                    }
                }else if(result.message=="not found" && tableLength==10){
                    $("#alertNewMessageNum").html("99+");
                    $('#alertNewMessage').removeClass('hidden');
                    if(result.sMessage!=undefined){
                        $("#alertLatestMessage").html(result.sMessage);
                        $("#alertFormatTime").html(formatTime(result.sTime));
                    }
                }else if(result.message=="not found"){
                    $("#alertNewMessageNum").html("");
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