<!DOCTYPE html>
<html>
	<head>
		<title>实时显示服务器端数据</title>
		<script>
            // 创建 EventSource 对象，并指定服务器端的 PHP 文件路径
            var eventSource = new EventSource("sseTest.php");

            // 监听服务器端发送的事件
            eventSource.addEventListener("update", function (event) {
                // 获取服务器端发送的数据
                let data = event.data;
                console.dir(event);
                render("data1", "update:" + data, true);
            });

            // 监听服务器端发送的事件
            eventSource.addEventListener("message", function (event) {
                // 获取服务器端发送的数据
                let data = event.data;
                render("data1", "message:" + data, true);
            });

            eventSource.addEventListener("open", function (event) {
                render("data1", "open:" + "Connection to server opened", true);
            });


            eventSource.addEventListener("error", function (event) {
                render("data1", "error:" + "Error occurred:" + event, true);
            });

            // 关闭连接
            setTimeout(function () {
                eventSource.close();
                render("data1", "close: Connection closed", true);

            }, 5000);

            function render(targetById, content, breakLine)
            {
                let contents = `[${content}]`;
                if (breakLine)
                {
                    contents += "<br>";
                }

                byId(targetById).innerHTML += contents;
            }

            function byId(Id)
            {
                return document.getElementById(Id);
            }

		</script>
		<style>
            #data1{
                background : #ccc;
            }

            #data2{
                background : #9bff9b;
            }
		</style>
	</head>
	<body>
		<h1>实时显示服务器端数据</h1>
		<div id="data1"></div>
	</body>
</html>