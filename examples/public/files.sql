
CREATE TABLE `files` (
  `id` bigint(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '文件原名',
  `path` varchar(255) NOT NULL DEFAULT '' COMMENT '文件路径',
  `mime` varchar(64) NOT NULL DEFAULT '' COMMENT '文件mime',
  `size` bigint(11) unsigned NOT NULL DEFAULT '0' COMMENT '文件大小',
  `ext` varchar(255) NOT NULL DEFAULT '' COMMENT '文件后缀',
  `hash` varchar(255) NOT NULL DEFAULT '' COMMENT '最大的文件id',
  `remark` text COMMENT '备注',
  `time` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `_hash` (`hash`),
  KEY `_ext` (`ext`),
  KEY `_name` (`name`),
  KEY `_mime` (`mime`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4;
