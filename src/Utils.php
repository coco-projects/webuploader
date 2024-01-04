<?php

    namespace Coco\webuploader;

class Utils
{
    public static function isLinux(): bool
    {
        return (DIRECTORY_SEPARATOR === '/');
    }

    public static function safeMergePath(array $paths): string
    {
        $t = [];
        foreach ($paths as $k => $path) {
            $path and ($t[] = rtrim($path, '\\/'));
        }

        return static::sanitizeFileName(implode(DIRECTORY_SEPARATOR, $t));
    }

    public static function sanitizeFileName($folderName): string
    {
        $t = explode(DIRECTORY_SEPARATOR, $folderName);

        $result = array_map(function ($section) {

            $specialChars = [
                ' ',
                '>',
                '<',
                '?',
                ':',
                '*',
                '|',
                '"',
                '\'',
            ];

            $h = (DIRECTORY_SEPARATOR == '\\') ? "/" : "\\";

            $specialChars[] = $h;

            return str_replace($specialChars, '_', $section);
        }, $t);

        return implode(DIRECTORY_SEPARATOR, $result);
    }


    public static function mergeFiles(array $fileArray, string $target, ?callable $progressCallback = null): bool
    {
        $bufferSize = 1024 * 8;

        $files = [];

        foreach ($fileArray as $k => $file) {
            $filePath = realpath($file);
            if ($filePath !== false) {
                $files[$k] = $filePath;
            }
        }

        $total = count($fileArray);

        if (function_exists("exec")) {
            $buffer = 10;

            $filesArray2 = array_chunk($files, $buffer);

            foreach ($filesArray2 as $k => $filesArray1) {
                $command   = [];
                $command[] = 'cat';

                foreach ($filesArray1 as $file) {
                    $command[] = ' ' . escapeshellarg($file);
                }

                $command[] = ($k == 0) ? ' > ' : ' >> ';
                $command[] = escapeshellarg($target);

                exec(implode('', $command), $output, $exitCode);

                if (is_callable($progressCallback)) {
                    call_user_func_array($progressCallback, [($k * $buffer) / $total]);
                }
            }

            if (is_callable($progressCallback)) {
                call_user_func_array($progressCallback, [1]);
            }
            return true;
        } else {
            $targetHandle = fopen($target, 'wb');

            if (!$targetHandle) {
                return false;
            }

            foreach ($files as $k => $file) {
                $sourceHandle = fopen($file, 'rb');

                if (!$sourceHandle) {
                    fclose($targetHandle);

                    return false;
                }

                while (!feof($sourceHandle)) {
                    if (fwrite($targetHandle, fread($sourceHandle, $bufferSize)) === false) {
                        fclose($sourceHandle);
                        fclose($targetHandle);

                        return false;
                    }
                }

                fclose($sourceHandle);
                if (is_callable($progressCallback)) {
                    call_user_func_array($progressCallback, [($k + 1) / $total]);
                }
            }

            fclose($targetHandle);

            if (is_callable($progressCallback)) {
                call_user_func_array($progressCallback, [1]);
            }
            return true;
        }
    }

    public static function copyLargeFile($source, $target, $bufferSize = 1024 * 8): bool
    {
        if ($source instanceof \SplFileInfo) {
            // 获取源文档路径
            $source = $source->getPathname();
        }

        if (!file_exists($source) || !is_readable($source)) {
            // 检查源文档是否存在或可读
            return false;
        }

        if (function_exists("exec")) {
            $command = [];
            if (!Utils::isLinux()) {
                $command[] = 'COPY ';
            } else {
                $command[] = 'cp -f ';
            }

            $command[] = escapeshellarg($source);
            $command[] = ' ';
            $command[] = escapeshellarg($target);

            exec(implode('', $command), $output, $exitCode);

            return ($exitCode === 0);
        } else {
            // 使用 PHP 实现文档复制
            $sourceHandle = fopen($source, 'rb');
            $targetHandle = fopen($target, 'wb');

            if (!$sourceHandle || !$targetHandle) {
                // 无法打开文档句柄
                return false;
            }

            while (!feof($sourceHandle)) {
                if (fwrite($targetHandle, fread($sourceHandle, $bufferSize)) === false) {
                    fclose($sourceHandle);
                    fclose($targetHandle);

                    return false;
                }
            }

            fclose($sourceHandle);
            fclose($targetHandle);

            return true;
        }
    }
}
