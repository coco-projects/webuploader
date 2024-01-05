(function (window_, $) {
    /*
     {
     upload            : "start-upload",
     stop              : "stop-upload",
     getFile           : "get-file",
     getFiles          : "get-files",
     addFile           : "add-file",
     addFiles          : "add-file",
     sort              : "sort-files",
     removeFile        : "remove-file",
     cancelFile        : "cancel-file",
     skipFile          : "skip-file",
     retry             : "retry",
     isInProgress      : "is-in-progress",
     makeThumb         : "make-thumb",
     md5File           : "md5-file",
     getDimension      : "get-dimension",
     addButton         : "add-btn",
     predictRuntimeType: "predict-runtime-type",
     refresh           : "refresh",
     disable           : "disable",
     enable            : "enable",
     reset             : "reset"
     }
     */

    let fileObject = function (file, uploader) {

        let this_ = this;

        this.file = file;

        this.uploader = uploader;

        // uploader_WU_FILE_0
        this.className = this.uploader.options.dnd.replace("#", "") + "_" + file.id;

        //uploader_WU_FILE_0_filter
        this.filterName      = this.className + "_filter";
        this.mergeFilterName = this.className + "_mergeFilter";

        this.doneInfoMap = {
            "inited"   : "初始化完成",
            "queued"   : "等待上传",
            "progress" : "上传中",
            "error"    : "上传出错",
            "complete" : "上传完成",
            "cancelled": "上传取消",
            "interrupt": "上传中断",
            "invalid"  : "文件不合格"
        };
    };

    fileObject.prototype.getJqObject = function () {
        return $(this.uploader.options.dnd + " ." + this.className);
    };

    fileObject.prototype.createUploadItemJqObject = function (fieldName) {

        let templaet = `
					<li class="single-img-box-item layui-margin-1 layui-padding-1 __fileClassId__">
						<div class="single-img-upload-preview-box">
							<img class="single-img-upload-preview">
						</div>
						<div class="single-img-upload-info">
							<div class="single-img-upload-info-title layui-padding-1">__fileName__</div>
							<div class="single-img-upload-info-mime layui-padding-1">__MIME__</div>

							<div class="" style="padding: 3px 0;">
								<div class="layui-btn-group">
									<button class="layui-btn layui-btn-xs layui-btn-danger img-delete">
										<i class="layui-icon layui-icon-clear"></i>
									</button>
									<button class="layui-btn layui-btn-xs img-reupload" style="display: none">
										<i class="layui-icon layui-icon-upload-circle"></i>
									</button>
								</div>
							</div>

							<div class="" style="padding: 3px 0;">
								<span class="layui-badge layui-bg-cyan "><span class=" single-img-chunk-success">0</span>/<span class=" single-img-chunk-total">1</span></span>
								<span class="layui-badge layui-bg-blue ">__fileSize__</span>
							</div>

							<div class="" style="padding: 3px 0;">
								<span class="layui-badge layui-bg-orange single-img-upload-time">-</span>
								<span class="layui-badge layui-bg-red single-img-upload-exists" style="display: none"></span>
								<span class="layui-badge layui-bg-green single-img-upload-merged" style="display: none;"><i class="layui-icon layui-icon-ok-circle layui-font-12"></i></span>
								<span class="layui-badge layui-bg-black single-img-upload-mergeing" style="display: none;">合并中...</span>
								<span class="layui-badge layui-bg-green single-img-upload-merge-error" style="display: none;"></span>
							</div>

							<div class="single-img-upload-msg layui-font-red single-img-done-info"></div>
						</div>

						<div class="layui-progress layui-progress-big layui-margin-1" lay-showPercent=true lay-filter="__filterName__">
							<div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>
						</div>

						<div class="layui-progress layui-progress-big layui-margin-1" lay-showPercent=true lay-filter="__mergeFilterName__">
							<div class="layui-progress-bar layui-bg-blue" lay-percent="0%"></div>
						</div>

						<input type="hidden" name="__fieldName__" class="form-value">
					</li>
`;

        let map_ = {
            __MIME__    : this.file.type,
            __fileSize__: WebUploader.formatSize(this.file.size),
            __fileName__: this.file.name,

            __fieldName__      : fieldName,
            __fileClassId__    : this.className,
            __filterName__     : this.filterName,
            __mergeFilterName__: this.mergeFilterName
        };

        return $(strtr(templaet, map_));
    };

    fileObject.prototype.onStatusError = function (callback) {
        // console.dir(this.file.getStatus());

        // INITED   : "inited",    // 初始状态
        // QUEUED   : "queued",    // 已经进入队列, 等待上传
        // PROGRESS : "progress",    // 上传中
        // ERROR    : "error",    // 上传出错，可重试
        // COMPLETE : "complete",    // 上传完成。
        // CANCELLED: "cancelled",    // 上传取消。
        // INTERRUPT: "interrupt",    // 上传中断，可续传。
        // INVALID  : "invalid"    // 文件不合格，不能重试上传。

        if (this.file.getStatus() === "invalid")
        {
            let text = "";
            switch (this.file.statusText)
            {
                case "exceed_size":
                    text = this.file.name + " : 文件大小超出限制";
                    break;

                case "interrupt":
                    text = this.file.name + " : 上传暂停";

                    break;

                default:
                    text = this.file.name + " : 上传失败，请重试";

                    break;
            }

            callback(text, this.file.statusText);
        }
    };

    fileObject.prototype.makeThumb = function (callback, width, height) {
        let ratio = window.devicePixelRatio || 1;

        (!width) || (width = 200 * ratio)
        (!height) || (height = 200 * ratio);

        this.uploader.makeThumb(this.file, function (error, src) {
            callback(src, error);
        }, width, height);
    };

    fileObject.prototype.getDataUrl = function (callback) {
        //生成图片
        let reader       = new FileReader();
        // 绑定 loadend 事件，文档读取结束后执行回调函数
        reader.onloadend = function () {
            // 获取文档内容
            let dataURL = reader.result;
            callback(dataURL);
        };

        // 读取原文档内容
        reader.readAsDataURL(this.file.source.getSource());
    };

    fileObject.prototype.isImage = function () {
        return /^image/.test(this.file.type);
    };

    fileObject.prototype.setPercentsage = function (percent) {
        let this_ = this;

        layui.use(function () {
            let element = layui.element;
            element.progress(this_.filterName, percent + "%");
        });
    };

    fileObject.prototype.setMergePercentsage = function (percent) {
        let this_ = this;

        layui.use(function () {
            let element = layui.element;
            element.progress(this_.mergeFilterName, percent + "%");
        });
    };

    fileObject.prototype.setDoenInfo = function (info) {
        let this_ = this;
        this_.getJqObject().find(".single-img-done-info").text(info);
    };

    fileObject.prototype.setDoneTime = function (time) {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-time").text(time);
    };

    fileObject.prototype.setFileExists = function () {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-exists").text("秒!").show();
    };


    fileObject.prototype.setFileChunkTotal = function (text) {
        let this_ = this;

        this_.getJqObject().find(".single-img-chunk-total").text(text).show();
    };

    fileObject.prototype.setFileChunkMerged = function () {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-merged").show();
    };

    fileObject.prototype.setFileChunkMergeing = function () {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-mergeing").show();
    };


    fileObject.prototype.setFileChunkMergeingDone = function () {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-mergeing").hide();
    };

    fileObject.prototype.setFileChunkMergeError = function (text) {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-merge-error").text(text).show();
    };

    fileObject.prototype.removeFileChunkMergeError = function () {
        let this_ = this;

        this_.getJqObject().find(".single-img-upload-merge-error").hide();
    };

    fileObject.prototype.setFormValue = function (value) {
        let this_ = this;

        this_.getJqObject().find(".form-value").val(value);
    };

    fileObject.prototype.getFileChunkTotal = function () {
        let this_ = this;

        return parseInt(this_.getJqObject().find(".single-img-chunk-total").text());
    };

    fileObject.prototype.incFileChunkSuccess = function () {
        let this_   = this;
        let itemObj = this_.getJqObject().find(".single-img-chunk-success");

        let chunkSuccess = parseInt(itemObj.text()) + 1;

        if (this.getFileChunkTotal() === chunkSuccess)
        {
            itemObj.parent().removeClass("layui-bg-cyan").addClass("layui-bg-blue");
        }

        itemObj.text(chunkSuccess);
    };

    fileObject.prototype.setFileChunkSuccess = function () {
        let this_   = this;
        let itemObj = this_.getJqObject().find(".single-img-chunk-success");
        itemObj.parent().removeClass("layui-bg-cyan").addClass("layui-bg-blue");

        itemObj.text(this.getFileChunkTotal());
    };

    window_.fileObject = fileObject;
})(window, jQuery);


(function (window_, $) {

    let uploaderController = function (id, userConfig) {

        let this_ = this;

        this.userConfig = userConfig;
        this.id         = id;
        this.timer      = null;

    };

    uploaderController.prototype.initConfig = function () {

        // 可能有pedding, ready, uploading, confirm, done.
        this.state          = "pedding";
        this.percentages    = {};
        this.allFileSize    = 0;
        this.allFileCount   = 0;
        this.startTime      = 0;
        this.uploaderConfig = {};
        this.chunkStatus    = {};
        this.uploader       = null;

        this.initView();

        let baseConfig = {
            dnd             : this.id,
            disableGlobalDnd: true,
            paste           : document.body,
            method          : "POST",
            sendAsBinary    : false,
            compress        : false,//不启用压缩
            resize          : false,//尺寸不改变
            prepareNextFile : true,
            disableWidgets  : "log",
            chunked         : true,
            pick            : {
                multiple: true,
                id      : $(this.id + " .file-picker")
            }
        };

        let defaultConfig = {
            accept             : {
                title     : "file",
                extensions: "",
                mimeTypes : "*/*"
            },
            fileNumLimit       : 500,
            fileSizeLimit      : 1024 * 1024 * 1024,
            fileSingleSizeLimit: 1024 * 1024 * 10
        };

        this.uploaderConfig = $.extend(true, defaultConfig, this.userConfig, baseConfig);
    };

    uploaderController.prototype.getJqObject = function () {
        return $(this.id);
    };

    uploaderController.prototype.initUploader = function () {

        let this_ = this;

        WebUploader.Uploader.register({
            name              : "before-send-file",
            "before-send-file": function (file) {
                let fileObjectManager = new fileObject(file, this_.getUploader());

                // console.log("beforeStartSendFile", file);

                //获取整个文件chunk上传的状态
                let deferred = WebUploader.Deferred();

                // console.dir(file);
                // console.dir(file.name)
                // console.dir(file.size)

                let hash = createFileIdentifier(file.name, file.size);

                $.ajax({
                    type    : "GET",
                    url     : this_.getChunkStatusApi,
                    data    : {
                        hash: hash
                    },
                    dataType: "json",
                    success : function (data) {
                        if (parseInt(data["code"]) === 1)
                        {
                            let tempData = data["data"];
                            let hash     = data["data"]["hash"];

                            this_.chunkStatus[hash] = tempData;
                        }

                        deferred.resolve();
                    },
                    error   : function () {
                        deferred.resolve();
                    }
                });

                return deferred.promise();
            }
        });

        WebUploader.Uploader.register({
            name         : "before-send",
            "before-send": function (block) {
                let fileObjectManager = new fileObject(block.file, this_.getUploader());

                // console.log("beforeChunkSend", block);

                let deferred   = WebUploader.Deferred();
                let curChunk   = block.chunk;
                let totalChunk = block.chunks;

                let hash = createFileIdentifier(block.file.name, block.file.size);
                // console.dir(block)

                // console.dir(block.file.name);
                // console.dir(block.file.size);

                if (this_.chunkStatus[hash])
                {
                    let tempData = this_.chunkStatus[hash];

                    if (tempData["is_exists"] === 1)
                    {
                        fileObjectManager.setFileExists();
                        fileObjectManager.setFileChunkSuccess();
                        fileObjectManager.setFormValue(tempData["savename"]);

                        fileObjectManager.getJqObject().find(".img-delete").remove();
                        fileObjectManager.getJqObject().find(".img-reupload").remove();

                        deferred.reject();
                    }
                    else
                    {
                        let uploadedChunk = tempData["uploaded_chunk"];

                        if (uploadedChunk.hasOwnProperty(curChunk))
                        {
                            //deferred.reject() 则这个请求不会被发送
                            fileObjectManager.incFileChunkSuccess();

                            deferred.reject();
                        }
                        else
                        {
                            deferred.resolve();
                        }
                    }
                }
                else
                {
                    deferred.resolve();
                }

                return deferred.promise();
            }
        });

        this.uploader = WebUploader.create(this.uploaderConfig);
    };

    uploaderController.prototype.getUploader = function () {
        return this.uploader;
    };

    uploaderController.prototype.initView = function () {
        let template = `
<div class="single-img-upload-container layui-padding-1">
	<div class="title"></div>
	<div class="file-picker"></div>
	<div class="layui-padding-1 layui-font-gray layui-font-18" style="text-align: center">拖拽文件至下方区域</div>

	<div class="layui-padding-1 layui-font-black layui-font-16" style="">
		<span>允许文件格式 : <span class="supported-format layui-font-blue"></span></span>, <span>单文件大小限制 : <span class="supported-single-size layui-font-blue"></span></span>,
		<span>单次最多上传总大小 : <span class="supported-total-size layui-font-blue"></span></span>, <span>单次最多上传个数 : <span class="supported-count layui-font-blue"></span></span>
	</div>

	<div class="layui-padding-1 layui-font-black layui-font-16" style="">
		<span>已添加 <span class="already-add-count layui-font-blue">0</span> 个文件</span>,
		<span>共 <span class="already-add-size layui-font-blue">0</span></span>,
		<span>上传历时 <span class="upload-use-time layui-font-blue">0</span></span>,
		<span>平均速度 <span class="upload-speed layui-font-blue">0</span></span>,
		<span><span class="upload-status layui-badge layui-bg-blue"></span></span>
	</div>

	<div class="layui-padding-1 layui-font-black layui-font-16 current-add-count-progress" style="">
		<span class="layui-padding-1" style="display: inline-block">总文件个数进度 <span class="layui-font-blue current-add-count"></span>/<span class="layui-font-blue already-add-count"></span></span>
		<div class="layui-progress layui-progress-big" lay-showPercent="true">
			<div class="layui-progress-bar" lay-percent=""></div>
		</div>
	</div>

	<div class="layui-padding-1 layui-font-black layui-font-16 current-add-size-progress" style="">
		<span class="layui-padding-1" style="display: inline-block">
            总文件大小进度 <span class="layui-font-blue current-add-size"></span>
            /<span class="layui-font-blue already-add-size"></span>
            ,秒传<span class="layui-font-blue already-exists">0</span>
            ,已合并<span class="layui-font-blue already-merge">0</span>
            ,合并失败<span class="layui-font-blue already-merge-fail">0</span>
		</span>
		<div class="layui-progress layui-progress-big" lay-showPercent="true">
			<div class="layui-progress-bar layui-bg-purple" lay-percent=""></div>
		</div>
	</div>

	<div class="layui-margin-1">
	    <span class="layui-margin-2 upload-error-info layui-bg-red layui-font-20" style="display: block;text-align: center;"></span>
		<div class="layui-btn-container">
			<button class="layui-btn layui-btn-xs layui-btn-danger uploader-reload">
				<i class="layui-icon layui-icon-clear"></i>清空重选
			</button>
		</div>

		<div class="layui-btn-container">
			<button class="layui-btn layui-btn-xs layui-bg-blue uploader-start-upload">
				<i class="layui-icon layui-icon-upload-circle"></i>开始上传
			</button>

			<button class="layui-btn layui-btn-xs layui-bg-green uploader-paused-upload" style="display: none;">
				<i class="layui-icon layui-icon-pause"></i>暂停上传
			</button>
		</div>
	</div>
	<ul class="single-img-box "></ul>
</div>

					`;

        $(this.id).append($(template));
    };

    uploaderController.prototype.initViewParams = function () {
        let this_ = this;

        this.getJqObject().find(".current-add-count-progress .layui-progress").attr("lay-filter", this.countProgressFilter);
        this.getJqObject().find(".current-add-size-progress .layui-progress").attr("lay-filter", this.sizeProgressFilter);

        this.setAllowExt(this.uploaderConfig.accept.extensions);
        this.setTitle(this.title);
        this.setAllowFileNumLimit(this.uploaderConfig.fileNumLimit);
        this.setAllowFileSingleSizeLimit(WebUploader.formatSize(this.uploaderConfig.fileSingleSizeLimit));
        this.setAllowFileSizeLimit(WebUploader.formatSize(this.uploaderConfig.fileSizeLimit));
        this.setFileCountPercentsage(0);
        this.setFileSizePercentsage(0);
        this.setFileSizeNow(0);
        this.setFileCountNow(0);
    };

    uploaderController.prototype.setState = function (val) {

        let file;
        let stats;
        let this_   = this;
        let status_ = this_.uploader.getStats();

        this_.setUploadStatus(val);

        this_.state = val;

        switch (this_.state)
        {
            //刚初始化好，一个文件也没得，等待添加文件
            case "pedding":

                this_.getUploaderButton().hide();
                this_.getPausedButton().hide();
                this_.getJqObject().find(".file-picker").show();
                this_.getJqObject().find(".uploader-reload").hide();

                this_.uploader.refresh();
                break;

            //有至少一个文件，等待上传
            case "ready":

                this_.getUploaderButton().show();
                this_.getPausedButton().hide();
                this_.getJqObject().find(".file-picker").show();
                this_.getJqObject().find(".uploader-reload").show();

                this_.uploader.refresh();
                break;

            //点了上传，正在上传中
            case "uploading":

                this_.getUploaderButton().hide();
                this_.getPausedButton().show();
                this_.getJqObject().find(".file-picker").hide();
                this_.getJqObject().find(".uploader-reload").hide();

                break;

            //点了暂停
            case "paused":
                this_.getUploaderButton().show();
                this_.getPausedButton().hide();
                this_.getJqObject().find(".file-picker").show();
                this_.getJqObject().find(".uploader-reload").show();


                break;

            // uploadFinished 中触发
            case "confirm":
                this_.getJqObject().find(".file-picker").hide();
                this_.getJqObject().find(".uploader-reload").show();

                if (status_.successNum && !status_.uploadFailNum)
                {
                    this_.setState("finish");
                }
                else
                {

                }
                break;

            case "finish":
                this_.getUploaderButton().hide();
                this_.getPausedButton().hide();


                if (status_.successNum)
                {
                    // console.log("上传成功");
                }
                else
                {
                    // 没有成功的图片，重设
                    this_.setState("done");
                    location.reload();
                }
                break;
        }

    };

    uploaderController.prototype.addItemJqObject = function (jqObject) {
        $(this.id + " .single-img-box").append(jqObject);
    };

    uploaderController.prototype.calcQueueTotalSize = function () {
        let total = 0;

        for (const fileId in this.percentages)
        {
            total += this.percentages[fileId]["size"];
        }

        return total;
    };

    uploaderController.prototype.calcQueueUploadedSize = function () {
        let loaded = 0;

        for (const fileId in this.percentages)
        {
            loaded += this.percentages[fileId]["percentages"] * this.percentages[fileId]["size"];
        }

        return loaded;
    };


    uploaderController.prototype.calcAllPercentage = function () {

        let
            percentSize,
            percentCount,
            loaded = this.calcQueueUploadedSize(),
            status = this.uploader.getStats(),
            total  = this.calcQueueTotalSize();

        percentSize = total ? (loaded / total) : 0;
        percentSize = percentSize * 100;
        percentSize = percentSize.toFixed(2);

        percentCount = status.successNum / this.allFileCount;
        percentCount = percentCount * 100;
        percentCount = percentCount.toFixed(2);


        this.setFileSizeNow(WebUploader.formatSize(loaded));
        this.setFileCountNow(status.successNum);

        this.setUploadUseTime();
        this.setUploadSpeed(WebUploader.formatSize((loaded / this.getUsedTime())) + "/S");

        this.setFileSizePercentsage(percentSize);
        this.setFileCountPercentsage(percentCount);

        /*
         `successNum` 上传成功的文件数
         `progressNum` 上传中的文件数
         `cancelNum` 被删除的文件数
         `invalidNum` 无效的文件数
         `uploadFailNum` 上传失败的文件数
         `queueNum` 还在队列中的文件数
         `interruptNum` 被暂停的文件数

         console.log(uploader.getStats());

         */
    };

    uploaderController.prototype.setSingleFileSize = function (fileId, fileSize) {
        if (!this.percentages[fileId])
        {
            this.percentages[fileId] = {
                "size"       : fileSize,
                "time"       : 0,
                "percentages": 0
            };
        }
    };

    uploaderController.prototype.initStartTime = function () {
        return this.startTime = Date.now();
    };

    uploaderController.prototype.getUsedTime = function () {
        return ((Date.now() - this.startTime) / 1000);
    };

    uploaderController.prototype.initSingleFileStartTime = function (fileId) {
        return this.percentages[fileId]["time"] = Date.now();
    };

    uploaderController.prototype.getSingleFileStartTime = function (fileId) {
        return this.percentages[fileId]["time"];
    };

    uploaderController.prototype.getSingleFileUsedTime = function (fileId) {
        return ((Date.now() - this.percentages[fileId]["time"]) / 1000);
    };

    uploaderController.prototype.setSingleFilePercentageFloat = function (fileId, percentages) {
        this.percentages[fileId]["percentages"] = percentages;
    };

    uploaderController.prototype.incFileSize = function (value) {
        this.allFileSize += value;
    };

    uploaderController.prototype.decFileSize = function (value) {
        this.allFileSize -= value;
    };

    uploaderController.prototype.incFileCount = function () {
        this.allFileCount++;
    };

    uploaderController.prototype.decFileCount = function () {
        this.allFileCount--;
    };

    uploaderController.prototype.addFile = function (file) {
        this.setSingleFileSize(file.id, file.size);
        this.incFileSize(file.size);
        this.incFileCount();
        this.setFileCountTotal((this.allFileCount));
        this.setFileSizeTotal(WebUploader.formatSize(this.allFileSize));
    };

    uploaderController.prototype.removeFile = function (file) {
        delete this.percentages[file.id];
        this.decFileSize(file.size);
        this.decFileCount();
        this.setFileCountTotal((this.allFileCount));
        this.setFileSizeTotal(WebUploader.formatSize(this.allFileSize));
    };


//组件标题
    uploaderController.prototype.setTitle = function (value) {
        let this_ = this;
        this.getJqObject().find(".title").text(value);

    };

//文件个数进度条
    uploaderController.prototype.setFileCountPercentsage = function (percent) {
        let this_ = this;

        layui.use(function () {
            let element = layui.element;
            element.progress(this_.countProgressFilter, percent + "%");
        });
    };

//文件大小进度条
    uploaderController.prototype.setFileSizePercentsage = function (percent) {
        let this_ = this;

        layui.use(function () {
            let element = layui.element;
            element.progress(this_.sizeProgressFilter, percent + "%");
        });
    };

//添加文件总个数
    uploaderController.prototype.setFileCountTotal = function (number) {
        let this_ = this;
        this.getJqObject().find(".already-add-count").text(number);

    };

//添加文件总大小
    uploaderController.prototype.setFileSizeTotal = function (number) {
        let this_ = this;
        this.getJqObject().find(".already-add-size").text(number);
    };

//当前上传文件个数，动态更新
    uploaderController.prototype.setFileCountNow = function (number) {
        let this_ = this;
        this.getJqObject().find(".current-add-count").text(number);

    };

//当前上传文件大小，动态更新
    uploaderController.prototype.setFileSizeNow = function (number) {
        let this_ = this;
        this.getJqObject().find(".current-add-size").text(number);
    };

//允许格式
    uploaderController.prototype.setAllowExt = function (value) {
        let this_ = this;
        this.getJqObject().find(".supported-format").text(value);
    };

//允许单文件大小
    uploaderController.prototype.setAllowFileSingleSizeLimit = function (value) {
        let this_ = this;
        this.getJqObject().find(".supported-single-size").text(value);
    };

//允许总件大小
    uploaderController.prototype.setAllowFileSizeLimit = function (value) {
        let this_ = this;
        this.getJqObject().find(".supported-total-size").text(value);
    };

//允许上传个数
    uploaderController.prototype.setAllowFileNumLimit = function (value) {
        let this_ = this;
        this.getJqObject().find(".supported-count").text(value);
    };

//上传历时
    uploaderController.prototype.setUploadUseTime = function () {
        let this_ = this;
        this.getJqObject().find(".upload-use-time").text(this.getUsedTime() + "S");
    };

//上传速度
    uploaderController.prototype.setUploadSpeed = function (value) {
        let this_ = this;
        this.getJqObject().find(".upload-speed").text(value);
    };

    //状态
    uploaderController.prototype.setUploadStatus = function (value) {
        let this_ = this;
        this.getJqObject().find(".upload-status").text(value);
    };

    //全局错误信息
    uploaderController.prototype.setUploadErrorInfo = function (value) {
        let this_ = this;
        this.getJqObject().find(".upload-error-info").text(value);
    };

    //已经合并
    uploaderController.prototype.incAlreadyMerge = function () {
        let this_ = this;
        let val   = this.getJqObject().find(".already-merge").text();
        val       = parseInt(val);
        val++;

        this.getJqObject().find(".already-merge").text(val);
    };

    //已经合并
    uploaderController.prototype.decAlreadyMerge = function () {
        let this_ = this;
        let val   = this.getJqObject().find(".already-merge").text();
        val       = parseInt(val);
        val--;

        this.getJqObject().find(".already-merge").text(val);
    };

    //合并出错
    uploaderController.prototype.incAlreadyMergeFail = function () {
        let this_ = this;

        let val = this.getJqObject().find(".already-merge-fail").text();
        val     = parseInt(val);
        val++;

        this.getJqObject().find(".already-merge").text(val);
    };

    //合并出错
    uploaderController.prototype.incAlreadyExists = function () {
        let this_ = this;

        let val = this.getJqObject().find(".already-exists").text();
        val     = parseInt(val);
        val++;

        this.getJqObject().find(".already-exists").text(val);
    };

    uploaderController.prototype.getUploaderButton = function () {
        let this_ = this;
        return this.getJqObject().find(".uploader-start-upload");
    };

    uploaderController.prototype.getPausedButton = function () {
        let this_ = this;
        return this.getJqObject().find(".uploader-paused-upload");
    };

    uploaderController.prototype.rerender = function () {
        let uploader = this.getUploader();
        uploader.destroy();

        clearInterval(this.timer);

        WebUploader.Uploader.unRegister("before-send-file");
        WebUploader.Uploader.unRegister("before-send");

        $(this.id).html("");
        this.render();
    };

    uploaderController.prototype.render = function () {
        let this_ = this;

        this.initConfig();

        this.getChunkStatusApi = this.uploaderConfig._extConfig.getChunkStatusApi;
        this.mergeApi          = this.uploaderConfig._extConfig.mergeApi;
        this.clearTempApi      = this.uploaderConfig._extConfig.clearTempApi;
        this.title             = this.uploaderConfig._extConfig.title;
        this.staticBasePath    = this.uploaderConfig._extConfig.staticBasePath;

        let idLabel              = this.id.replace("#", "");
        this.countProgressFilter = idLabel + "_count_filter";
        this.sizeProgressFilter  = idLabel + "_size_filter";

        this.initViewParams();
        this.initUploader();
        this.setState("pedding");

        let uploader = this.getUploader();

        uploader.on("error", function (code) {
            // console.dir("error", code);

            let text = "";
            switch (code)
            {
                case  "F_DUPLICATE" :
                    text = "该文档已经被选择了!";
                    break;
                case  "Q_EXCEED_NUM_LIMIT" :
                    text = "上传文档数量超过限制!";
                    break;
                case  "F_EXCEED_SIZE" :
                    text = "文档大小超过限制!";
                    break;
                case  "Q_EXCEED_SIZE_LIMIT" :
                    text = "所有文档总大小超过限制!";
                    break;
                case "Q_TYPE_DENIED" :
                    text = "文档类型不正确或者是空文档!";
                    break;
                default :
                    text = "未知错误!";
                    break;
            }
            this_.setUploadErrorInfo(text);
        });

        uploader.on("uploadBeforeSend", function (block, file, headers) {
            // console.log("uploadBeforeSend", block, file, headers);

            let fileObjectManager = new fileObject(file, uploader);
            fileObjectManager.setFileChunkTotal(file.chunks);

            let startByte = block.start;
            let endByte   = block.end;
            let fileSize  = block.total;

            //bytes 0-99/5000
            headers["Content-Range"] = `bytes ${Math.floor(startByte)}-${Math.ceil(endByte)}/${fileSize}`;

            // headers["x-chunk-number"]       = block.chunk;
            // headers["x-chunk-total-number"] = block.chunks;
            // headers["x-chunk-size"]         = Math.ceil(endByte) - Math.floor(startByte);
            // headers["x-file-name"]          = file.name;
            // headers["x-file-size"]          = fileSize;
            // headers["x-file-identity"]      = "rmghdygvdstcsjglltmbvkynxpeajgcg";

            // 返回headers对象，用于覆盖默认请求头
            return headers;
        });

        //当某个文件分片上传到服务端响应后，会派送此事件来询问服务端响应是否有效。
        //如果此事件 handle r返回值为`false`, 则此文件将派送`server`类型的`uploadError`事件。
        uploader.on("uploadAccept", function (block, ret) {
// console.log("uploadAccept", block, ret);

            let fileObjectManager = new fileObject(block.file, uploader);
            fileObjectManager.incFileChunkSuccess();
        });

        uploader.on("beforeFileQueued", function (file) {

// console.log("beforeFileQueued", file);

        });

        //上传出错情况
        uploader.on("uploadError", function (file, reason) {
// console.log("uploadError", file, reason);

        });

        //所有文件开始上传时触发 uploader.upload(); 被调用时
        uploader.on("startUpload", function () {
// console.log("startUpload");
            this_.setState("uploading");

            this_.initStartTime();
        });

        //所有文件暂停上传时触发 uploader.stop(); 被调用时
        uploader.on("stopUpload", function () {
// console.log("stopUpload");

            this_.setState("paused");
        });

        //所有文件上传完成后触发，调用一次
        uploader.on("uploadFinished", function () {
// console.log("uploadFinished");

            this_.setState("confirm");

            this_.calcAllPercentage();
        });

        //单文件上传成功后触发，每个文件传成功都调用一次
        uploader.on("uploadComplete", function (file) {

// console.log("uploadComplete", file);


        });

        //每个文件上传过程中都实时触发
        uploader.on("uploadProgress", function (file, percentage) {

// console.log("uploadProgress", file, percentage);

            let fileObjectManager = new fileObject(file, uploader);

            fileObjectManager.setPercentsage(percentage * 100);
            this_.setSingleFilePercentageFloat(file.id, percentage);
            this_.calcAllPercentage();

            if (this_.getSingleFileStartTime(file.id) === 0)
            {
                this_.initSingleFileStartTime(file.id);
            }

            fileObjectManager.setDoneTime(this_.getSingleFileUsedTime(file.id) + "S");
        });

        //uploader.removeFile(file); 调用时触发
        uploader.on("fileDequeued", function (file) {
// console.log("fileDequeued", file);

            let fileObjectManager = new fileObject(file, uploader);
            let uploadItem        = fileObjectManager.getJqObject();

            this_.removeFile(file);
            uploadItem.remove();

            if (!this_.allFileCount)
            {
                this_.setState("pedding");
            }

        });

        //文件被加入队列时触发
        uploader.on("fileQueued", function (file) {
// console.log("fileQueued", file);

            let fileObjectManager = new fileObject(file, uploader);
            let uploadItem        = fileObjectManager.createUploadItemJqObject(this_.uploaderConfig._extConfig.fieldName);

            this_.setUploadErrorInfo("");

            tipContent(uploadItem.find(".single-img-upload-info-title"));
            tipContent(uploadItem.find(".single-img-upload-info-mime"));
            tipContent(uploadItem.find(".single-img-done-info"));

            if (fileObjectManager.isImage())
            {
                fileObjectManager.getDataUrl(function (dataURL) {
                    uploadItem.find(".single-img-upload-preview").attr("src", dataURL).off("click").on({
                        "click": function () {
                            layer.photos({
                                photos: {
                                    "title": "预览",
                                    "start": 0,
                                    "data" : [
                                        {
                                            "alt": "浩瀚宇宙",
                                            "pid": 5,
                                            "src": dataURL
                                        }
                                    ]
                                },
                                footer: false
                            });
                        }
                    });
                });
            }
            else
            {
                let preview = getFileIcon(file.ext, this_.staticBasePath);
                uploadItem.find(".single-img-upload-preview").attr("src", preview);
            }

            //删除按钮
            uploadItem.find(".img-delete").off("click").on({
                "click": function () {
                    uploader.removeFile(file);
                }
            });

            //重新上传按钮
            uploadItem.find(".img-reupload").off("click").on({
                "click": function () {
                    uploader.retry(file);
                }
            });

            file.on("statuschange", function (current, previous) {
// console.log(file.id, previous + " -> " + current);


                if (current === "complete")
                {
                    let fileObjectManager = new fileObject(file, uploader);

                    // fileObjectManager.getJqObject().find(".img-delete").remove();
                    fileObjectManager.getJqObject().find(".img-reupload").show();


                    fileObjectManager.setPercentsage(100);
                    this_.setSingleFilePercentageFloat(file.id, 1);

                    this_.calcAllPercentage();

                    let hash = createFileIdentifier(file.name, file.size);

                    if (this_.chunkStatus[hash])
                    {
                        if ((this_.chunkStatus[hash]["is_merge"] === 1))
                        {
                            fileObjectManager.setFileChunkMergeing();

                            var eventSource = new EventSource(this_.mergeApi + "?hash=" + hash);


                            eventSource.addEventListener("open", function (event) {

                            });

                            eventSource.addEventListener("error", function (event) {
                                this_.incAlreadyMergeFail();
                                fileObjectManager.setFileChunkMergeError("连接出错");
                            });

                            // 监听服务器端发送的事件
                            eventSource.addEventListener("msg", function (event) {
                                // 获取服务器端发送的数据
                                let data = JSON.parse(event.data);

                                fileObjectManager.setFileChunkMergeingDone();

                                if (parseInt(data["code"]) === 1)
                                {
                                    this_.incAlreadyMerge();
                                    fileObjectManager.setFileChunkMerged();
                                    fileObjectManager.removeFileChunkMergeError();
                                    fileObjectManager.setFormValue(data["savename"]);

                                    fileObjectManager.getJqObject().find(".img-delete").remove();
                                    fileObjectManager.getJqObject().find(".img-reupload").remove();
                                }
                                else
                                {
                                    this_.incAlreadyMergeFail();
                                    fileObjectManager.setFileChunkMergeError(data["msg"]);
                                }

                                eventSource.close();
                            });


                            // 监听服务器端发送的事件
                            eventSource.addEventListener("process", function (event) {
                                // 获取服务器端发送的数据
                                let data = JSON.parse(event.data);
                                fileObjectManager.removeFileChunkMergeError();

                                fileObjectManager.setMergePercentsage(data.process * 100);
                            });
                        }
                        else
                        {
                            this_.incAlreadyExists();
                        }
                    }
                    else
                    {
                        fileObjectManager.setFileChunkMergeError("没分片数据");
                    }
                }

                fileObjectManager.setDoenInfo(fileObjectManager.doneInfoMap[current]);
            });


            this_.addFile(file);
            this_.addItemJqObject(uploadItem);

            fileObjectManager.setDoenInfo(fileObjectManager.doneInfoMap[file.getStatus()]);

            this_.setState("ready");

            fileObjectManager.onStatusError(function (msg, type) {
                console.dir(msg);
                console.dir(type);
            });

        });

        this_.getUploaderButton().on({
            "click": function () {

                if ([
                    "ready",
                    "paused"
                ].includes(this_.state))
                {
                    uploader.upload();
                }
            }
        });

        this_.getPausedButton().on({
            "click": function () {

                if ([
                    "uploading"
                ].includes(this_.state))
                {
                    uploader.stop();
                }
            }
        });

        $(".uploader-reload").on({
            "click": function () {
                this_.rerender();
            }
        });

        this.timer = setInterval(function () {
            $.ajax({
                type    : "GET",
                url     : this_.clearTempApi,
                dataType: "json",
                success : function (data) {
                },
                error   : function () {
                }
            });
        }, 30 * 60 * 1000);

        return this;
    };

    window_.uploaderController = uploaderController;


    function createFileIdentifier(originName, fileTotalSize)
    {
        return md5(originName + "" + fileTotalSize);
    }

    function getFileIcon(ext, basePath)
    {
        if (!basePath)
        {
            basePath = "";
        }

        let map = [
            "3dm",
            "3ds",
            "7z",
            "accdb",
            "ai",
            "air",
            "apk",
            "arj",
            "as",
            "asax",
            "ascx",
            "ashx",
            "asm",
            "asmx",
            "aspx",
            "autodesk",
            "avi",
            "bin",
            "bmp",
            "bz2",
            "c",
            "cab",
            "cdr",
            "cer",
            "chm",
            "class",
            "cmd",
            "code",
            "cpp",
            "cs",
            "cshtml",
            "csproj",
            "css",
            "csv",
            "dae",
            "djvu",
            "dll",
            "dmg",
            "dng",
            "doc",
            "docm",
            "docx",
            "dot",
            "dotm",
            "dotx",
            "dtd",
            "dwf",
            "dwg",
            "dxf",
            "dxf1",
            "eml",
            "eps",
            "epub",
            "exe",
            "f",
            "fbx",
            "file",
            "fla",
            "flv",
            "font",
            "framework",
            "gif",
            "graph_icon",
            "gz",
            "h",
            "hdr",
            "hlp",
            "html",
            "iam",
            "ico",
            "ifc",
            "indd",
            "ini",
            "ipa",
            "iso",
            "jar",
            "java",
            "jpg",
            "js",
            "json",
            "key",
            "ldf",
            "lnk",
            "makefile",
            "md",
            "mdb",
            "mdf",
            "mht",
            "mhtml",
            "midi",
            "mkv",
            "mov",
            "movie",
            "mp4",
            "mpp",
            "mpt",
            "msg",
            "msi",
            "music",
            "music1",
            "numbers",
            "o",
            "odp",
            "ods",
            "odt",
            "oexe",
            "oexe1",
            "office-others",
            "ogg",
            "pages",
            "pdb",
            "pdf",
            "php",
            "php_small",
            "picture_error",
            "pkg",
            "pl",
            "png",
            "pot",
            "potx",
            "pps",
            "ppsx",
            "ppt",
            "pptx",
            "prproj",
            "ps1",
            "psd",
            "pspimage",
            "pst",
            "pub",
            "py",
            "rar",
            "rb",
            "reg",
            "resx",
            "rmvb",
            "rtf",
            "rvt",
            "s",
            "sitx",
            "skp",
            "sln",
            "sql",
            "stl",
            "suo",
            "svg",
            "swf",
            "swift",
            "tar",
            "tga",
            "tgz",
            "txt",
            "txt_small",
            "utorrent",
            "vb",
            "vbproj",
            "vbs",
            "vcf",
            "vcproj",
            "vcxproj",
            "vdw",
            "vdx",
            "vnd-dgn",
            "vsd",
            "vsdx",
            "vss",
            "vst",
            "vsx",
            "vtx",
            "wasm",
            "xaml",
            "xap",
            "xls",
            "xlsb",
            "xlsm",
            "xlsx",
            "xlt",
            "xltx",
            "xml",
            "xps",
            "xsd",
            "xsl",
            "y",
            "zip"
        ];


        let icon = "file";

        if (map.includes(ext))
        {
            icon = ext;
        }

        return basePath + icon + ".png";
    }

})(window, jQuery);

