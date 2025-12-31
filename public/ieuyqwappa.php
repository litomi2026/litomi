<?php

date_default_timezone_set('America/New_York');
define('PR_PUB_INTEGRATION_CACHE_EXPIRATION_TIME_IN_SECONDS', 5 * 60);
define('INTEGRATION_BASE_URL', 'http://prscripts.com/d/?resource=pubJS');
define('SW_URL', 'https://prscripts.com/d/n/sw?did=373891');
define('CURL_TIMEOUT', 5);
define('DOMAIN_ID', "373891");
define('SERVER_PROTOCOL', 'HTTP/1.1');
define('SECRET_KEY', "f3253736506205e2fc312526c1ab7915da6b8783894f5736458adaed7f8c0ae9");
define('CREATED_TIMESTAMP', "1767181332");

/**
 * The key to store the script in cache, or the name of the local cache file.
 */
define('CACHEKEY', 'prCachedPRIntegrationScriptFor373891');

/**
 * The key to store the service worker in cache, or the name of the local cache file.
 */
define('SW_CACHEKEY', 'prCachedServiceWorkerFor373891');

/**
 * @var          boolean         Whether or not the plugrush integration script should be cached
 *                          in either Memcached, Memcache or in a local file. (Cache will be updated remotely when necessary)
 */
$cache = true;
header('Cache-Control: max-age=120');

if (isset($_GET['created'])) {
    output(CREATED_TIMESTAMP);
}


$generatedHash = hash('sha256', SECRET_KEY . getIfExists($_GET, 'timestamp'));
$clearCache = false;
if (getIfExists($_GET, 'timestamp') > strtotime('-1 day') && $generatedHash == getIfExists($_GET, 'clearCacheHash')) {
    $clearCache = true;
}

if (isset($_GET['sw'])) {
    if (!$clearCache && $cache) {
        $cachedScript = getCachedScript(SW_CACHEKEY);
        if ($cachedScript) {
            output($cachedScript);
        }
    }
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => SW_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => CURL_TIMEOUT,
        CURLOPT_USERAGENT => 'PRIntegrationScript',
        CURLOPT_REFERER => "litomi.in",
    ));

    $response = curl_exec($curl);

    if ($cache && curl_getinfo($curl, CURLINFO_HTTP_CODE) == 200) {
        setCachedScript(SW_CACHEKEY, $response);
        output($response);
    } else {
        http_response_code(500);
        echo('Server Issue');
        die();
    }
}
if (!$clearCache && $cache) {
    $cachedScript = getCachedScript(CACHEKEY);
    if ($cachedScript) {
        output($cachedScript);
    }
}

$currentTimestamp = time();
$adblockSafeHash = hash('sha256', SECRET_KEY . $currentTimestamp);
$urlQueryParams = "&t=" . $currentTimestamp . "&i=" . $adblockSafeHash;

$userAgent = '';
if (isset($_SERVER['HTTP_USER_AGENT']) && !empty($_SERVER['HTTP_USER_AGENT'])) {
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
}
$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL => INTEGRATION_BASE_URL . $urlQueryParams,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => CURL_TIMEOUT,
    CURLOPT_USERAGENT => $userAgent,
    CURLOPT_REFERER => !empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : "litomi.in",
));

$response = curl_exec($curl);

$setCacheSuccess = true;

if ($cache && curl_getinfo($curl, CURLINFO_HTTP_CODE) == 200 && isValidDomain($response)) {
    $setCacheSuccess = setCachedScript(CACHEKEY, $response);
}

output($response, $setCacheSuccess);

function getCacheExtension()
{
    $host = 'localhost';
    $port = 11211;
    if (class_exists('Memcached')) {
        $memcached = new Memcached();
        $memcached->addServer($host, $port);
        $serverIndex = $host . ':' . $port;
        $statuses = $memcached->getStats();
        if (isset($statuses[$serverIndex]['pid']) && $statuses[$serverIndex]['pid'] > 0) {
            return $memcached;
        }
    }
    if (class_exists('Memcache')) {
        if (!class_exists('MemcacheWrapper')) {
            class MemcacheWrapper {
                private $memcache;

                public function __construct($memcache) {
                    $this->memcache = $memcache;
                }

                public function set($key, $value, $expiration) {
                    return $this->memcache->set($key, $value, 0, $expiration);
                }

                public function get($key) {
                    return $this->memcache->get($key);
                }
            }
        }
        $memcache = new Memcache();
        if (@$memcache->connect($host, $port)) {
            return new MemcacheWrapper($memcache);
        }
    }
    return new WriteFile();
}

function setCachedScript($cacheKey, $content)
{
    $cache = getCacheExtension();

    return $cache->set($cacheKey, $content, PR_PUB_INTEGRATION_CACHE_EXPIRATION_TIME_IN_SECONDS);
}

function getCachedScript($cacheKey)
{
    $cache = getCacheExtension();
    return $cache->get($cacheKey);
}

function output($script, $setCacheSuccess = true)
{
    header('Content-Type: application/javascript');
    if (!$setCacheSuccess) {
        echo "//setcachefail\n";
    }
    echo $script;
    die();
}

function isValidDomain($response)
{
    if (!preg_match("/#domainIdString-(\d+)-domainIdString#/", $response, $matches)) {
        return false;
    }
    if (!isset($matches[1]) || $matches[1] != DOMAIN_ID) {
        return false;
    }
    return true;
}


class WriteFile
{
    function set($filename, $content, $expire)
    {
        try {
            $file = @fopen("./$filename", 'w');
            if (!$file) {
                return false;
            }
            fwrite($file, $content);
            return fclose($file);
        } catch (Exception $e) {
            return false;
        }
    }

    function get($filename)
    {
        try {
            if (!file_exists("./$filename")) {
                return false;
            }
            $content = file_get_contents("./$filename");
            if (!$content) {
                return false;
            }
            if ($this->isFileExpired($filename)) {
                return false;
            }
            return $content;
        } catch (Exception $e) {
            return false;
        }
    }

    function isFileExpired($filename)
    {
        // Increasing chance to expire the cache pre-emptively the final minute of cache time.
        return (time() + rand(0, 60)) - filemtime("./$filename") > PR_PUB_INTEGRATION_CACHE_EXPIRATION_TIME_IN_SECONDS;
    }
}

function getIfExists($input, $key)
{
    return isset($input[$key]) ? $input[$key] : null;
}
