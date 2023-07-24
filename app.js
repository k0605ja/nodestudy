const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path'); // path
 모듈 추가

const app = express();
const port = 3000;

// MySQL 연결 정보 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '0000',
    database: 'nodestudy'
});

// MySQL 연결
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Body Parser 미들웨어 사용
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // JSON 파싱 활성화

// public 디렉토리를 정적 파일 루트 디렉토리로 설정
app.use(express.static(path.join(__dirname, 'public')));

// // 이벤트 페이지 조회
// app.get('/', (req, res) => {
//     // 이벤트 페이지를 여기서 렌더링하여 클라이언트에 전달하거나,
//     // index.html과 같은 정적 파일을 보내는 것도 가능합니다.
//     res.send('index.html');
// });

// 이벤트 신청 폼 제출 처리
app.post('/submit-form', (req, res) => {
    console.log(req.body);
    const { name, age, gender, tel } = req.body;

    // MySQL에 데이터 저장
    const sql2 = 'INSERT INTO user (name, age, gender, tel) VALUES (?, ?, ?, ?)';
    connection.query(sql2, [name, age, gender, tel], (err, result) => {
        if (err) {
            console.error('Error inserting data into MySQL:', err);
            res.status(500).json({ message: '이벤트 신청 실패' });
        } else {
            console.log('Data inserted into MySQL');
            res.status(200).json({ message: '이벤트 신청 성공' });
        }
    });
});

// 수정
// 성공 페이지 렌더링
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
