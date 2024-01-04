<?php

    namespace Coco\webuploader;

    use think\db\BaseQuery;
    use think\db\ConnectionInterface;
    use think\DbManager;

class Db
{
    protected ?string              $table     = null;
    protected ?ConnectionInterface $dbConnect = null;
    protected static ?Db           $ins       = null;

    protected array $dbConfig = [
        'hostname' => '127.0.0.1',
        'password' => 'root',
        'username' => 'root',
        'charset'  => 'utf8mb4',
    ];

    protected function __construct($dbName, $table, $config = [])
    {
        foreach ($config as $k => $v) {
            if (isset($this->dbConfig[$k])) {
                $this->dbConfig[$k] = $v;
            }
        }

        $this->dbConfig['type']     = 'mysql';
        $this->dbConfig['database'] = $dbName;

        $dbManager = new DbManager();

        $dbManager->setConfig([
            'default'     => 'webuploader',
            'connections' => [
                'webuploader' => $this->dbConfig,
            ],
        ]);
        $this->table = $table;

        $this->dbConnect = $dbManager->connect('webuploader');
    }

    public static function getIns($dbName, $table, $config = []): ?Db
    {
        if (!static::$ins instanceof self) {
            static::$ins = new static($dbName, $table, $config);
        }

        return static::$ins;
    }

    public function getDbHandler(): BaseQuery
    {
        return $this->dbConnect->table($this->table);
    }
}
