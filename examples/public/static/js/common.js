function tipContent(jqObj)
{
    let indexTitle = null;
    jqObj.hover(function () {
        let elem   = this;
        indexTitle = layer.tips($(elem).text(), elem, {
            tips: 1
        });
    }, function () {
        layer.close(indexTitle);
    });
}

function strtr(template, map_)
{
    for (let key in map_)
    {
        let value = map_[key];
        template  = template.replace(key, value);
    }
    return template;
}

function md5(str)
{
    return SparkMD5.hash(str);
}