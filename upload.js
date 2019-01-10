/* 上传dist目录下所有文件 */
const Client = require('ssh2-sftp-client')
const ora = require('ora')
const path = require('path')
const glob = require('glob')
const sftp = new Client()
// 允许上传的文件扩展名
const allowFiles = ['html', 'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'eot', 'svg', 'ttf', 'woff', 'ico']

class uploadFn {
    /**
     * localPath        {String}        本地根路径 -- 上传文件
     * remotePath       {String}        服务器根路径 -- 上传文件
     * uploadFileArray  {Array}         存储上传文件路径地址的数组
     */
    constructor() {
        this.localPath = path.join(__dirname, '../dist').replace(/\\/g, '/')
        this.remotePath = '******'
        this.uploadFileArray = []
        this.uploadFileListArray = []
        this.connectFTP = new ora('开始连接服务器......')
        this.createDir = new ora('开始创建目录......')
        this.uploadFile = new ora('开始上传文件......')
        this.init()
    }
    init() {
        this.uploadFileArray = this.getAllPath()
        this.uploadFileListArray = this.getRemoteFileList().map(v => {
            return this.remotePath + '' + v
        })
        if (!this.uploadFileArray.length) {
            return console.error('获取本地文件路径失败，请检查文件名是否正确！')
        }
        this.uploadStart()
    }
    /* 开始上传服务器 */
    uploadStart() {
        this.connectFTP.start()
        sftp.connect({
            host: '*******',
            port: '*******',
            username: '*******',
            password: '*******',
        })
        .then(() => {
            this.connectFTP.succeed('连接服务器成功！')
            this.createDir.start()
            this.uploadFileListArray.forEach((v, i) => {
                console.log('需要创建的文件目录---' + v)
                sftp.mkdir(v).then(() => {
                    this.createDir.succeed('FTP--创建目录成功--' + v)
                    if (i == (this.uploadFileListArray.length -1)) {
                        this.createDir.succeed('FTP--目录创建完成！')
                        return true
                    }
                }).catch(err => {
                    this.createDir.fail('FTP--创建目录失败(已存在)--' + v)
                })
            })
        })
        .then(() => {
            this.uploadFile.start()
            this.uploadFileArray.forEach((v, i) => {
                let r = v.replace(this.localPath, this.remotePath)
                sftp.put(v, r)
                .then(() => {
                    this.uploadFile.succeed('FTP--上传文件成功--' + v )
                    if (i == (this.uploadFileArray.length -1)) {
                        this.uploadFile.succeed('FTP--所有文件上传成功！')
                        process.exit()
                    }
                })
                .catch(() => {
                    this.uploadFile.fail('FTP--上传文件失败--' + v)
                    process.exit()
                })
            })
        })
        .catch(err => {
            this.connectFTP.fail('服务器链接失败！')
            process.exit()
        })
    }
    // 全部文件 -- dist目录下所有文件
    getAllPath() {
        return glob.sync(`${this.localPath}/**/*.{${allowFiles.join(',')}}`)
    }
    // 获取文件上传目录[such as /static, /html]
    getRemoteFileList() {
        let createListArray = []
        this.uploadFileArray.forEach(v => {
            let filePath = v.split('/').slice(-1)[0]
            let fileListPath = v.replace(filePath, '')
            let createListPath = fileListPath.substring(fileListPath.indexOf('dist') + 5)
            if (createListArray.indexOf(createListPath) < 0) {
                createListArray.push(createListPath)
            }
        })
        let fsCreateList = [] //存储需要创建目录
        createListArray.forEach(v => {
            let arr = v.split('/')
            arr.pop()
            let a = ''
            arr.forEach(value => {
                a = a + '/' + value
                fsCreateList.push(a)
            })
        })
        // 将需要创建的目录去重，排序；按低层级往高层级排
        return fsCreateList = [...new Set(fsCreateList)].sort((a, b) => {
            return a.split('/').length - b.split('/').length
        })
    }
}

new uploadFn()