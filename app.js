const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const bcrypt = require('bcrypt');
const session = require('express-session');
const axios = require('axios');
const Query = require('mysql2/typings/protocol/sequences/Query');


// 추가
const pool = mysql.createPool(dbConfig); // MySQL Connection Pool


const app = express();
const port = 3000;

// // CORS 미들웨어 설정
// app.use(cors());

// // Content-Security-Policy 헤더 설정
// app.use((req, res, next) => {
//     res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:");
//     next();
// });



// MySQL 연결 정보 설정
const connection = mysql.createConnection({
    host: 'localhost', // MySQL 호스트
    user: 'root', // MySQL 사용자명
    password: '0000', // MySQL 비밀번호
    database: 'simple-login' // MySQL 데이터베이스 이름
});    


connection.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패: ' + err);
    } else {
        console.log('MySQL 연결 성공!.');
    }    
});    




// 세션 미들웨어
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
    })    
);    



// EJS view 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// JSON 데이터 미들웨어 사용
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // JSON 파싱 활성화

 

// 정적 파일 루트 디렉토리로 설정: public 디렉토리
app.use(express.static(path.join(__dirname, 'public')));


// 라우트: 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 라우트: 회원가입 페이지
app.get('/join', (req, res) => {
  res.sendFile(__dirname + '/join.html');
});
   
// 라우트: 로그인 페이지
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});
   




// 라우트: URL에 대해 처리를 정의하는 것 (GET, POST)
// 회원가입 신청 라우트
app.post('/join', (req, res) => {
    const { user_id, user_pw, user_name } = req.body;


    // 비밀번호 해시화
    bcrypt.hash(user_pw, 10, (err, hashedPassword) => {
        if (err) {
            console.error('비밀번호 해시화 오류:', err);
            res.status(500).json({ success: false, message: '회원가입 실패' });
        } else {
            

            // MySQL에 데이터 저장
            const sql = 'INSERT INTO users (user_id, user_pw, user_name) VALUES (?, ?, ?)';
            connection.query(sql, [user_id, hashedPassword, user_name], (err) => {
                if (err) {
                    console.error('MySQL에 데이터를 삽입하는 중 오류가 발생했습니다:', err);
                    res.status(500).json({ success: false, message: '회원가입 실패' });
                } else {
                    console.log('데이터가 SQL에 삽입되었습니다.');
                    res.status(200).json({ success: true, message: '회원가입 성공!' });
                }    
            });    
        }    
    });    
});    



// MySQL 연결
// 로그인 시 회원 정보 라우트
app.post('/login', async (req, res) => {
    const { user_id, user_pw } = req.body;
    
    // MySQL에서 해당 사용자 정보 가져오기
    const sql = 'SELECT * FROM users WHERE user_id = ?';
    
    // 클라이언트가 보낸 요청에서 user_name과 user_pw 추출
    connection.query(sql, [user_id], async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: '로그인 실패' });
        } else if (results.length === 0) {
            res.status(404).json({ message: '해당 아이디를 찾을 수 없습니다.' });
        } else {
            const user = results[0];

            try {
                // 비밀번호 비교
                const isPasswordMatched = await bcrypt.compare(user_pw, user.user_pw);

                if (isPasswordMatched) {
                    // 로그인 성공 시 사용자 데이터 세션으로 저장
                    req.session.user = user;

                    // 로그인 성공 시 로그인 성공 페이지(login-success.html)로 리다이렉트
                    res.sendFile(path.join(__dirname, 'public', 'login-success.html'));
                } else {
                    // 비밀번호가 일치하지 않음
                    res.status(401).json({ message: '잘못된 비밀번호입니다.' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: '로그인 실패' });
            }  
        }    
    });    
});    



// 회원가입 요청
const joinData = {
    user_id: 'admin',
    user_pw: '0000',
    user_name: '관리자'
};  

  
  axios.post('http://localhost:3000/join', joinData)
  .then((response) => {
    console.log('회원가입 결과:', response.data);
    
    // 로그인 요청
    const loginData = {
        user_id: 'admin',  
        user_pw: '0000'
    };  
    
    axios.post('http://localhost:3000/login', loginData)
      .then((response) => {
        console.log('로그인 결과:', response.data);
      })  
      .catch((error) => {
        console.error('로그인 실패:', error.response.data);
    });  
  })    
  .catch((error) => {
    console.error('회원가입 실패:', error.response.data);
  });  



  


// 로그인 성공 페이지 렌더링
app.get('/login-success', (req, res) => {
    if (req.session.user) {
        const { user_name } = req.session.user;
        // 로그인 성공 페이지를 렌더링하여 클라이언트에 보냅니다. 
        res.sendFile(path.join(__dirname, 'public', 'login-success.html'));

        res.render('login-success', { user_name });
    } else {
        // 로그인하지 않았을 경우 로그인 페이지로 리다이렉트
        res.redirect('/');
    }
});


// // 로그인 성공 페이지 렌더링
// app.get('/login-success', (req, res) => {
//     if (req.session.user) {
//         const { user_name } = req.session.user;
//         // Render the "login-success.ejs" template and pass the "user_name" value
//         res.render('login-success', { user_name });
//     } else {
//         // 로그인하지 않았을 경우 홈페이지로 리다이렉트
//         res.redirect('/');
//     }
// }); 



// 로그아웃 처리
app.get('/logout', (req, res) => {
    // 세션 삭제
    req.session.destroy(err => {
        if (err) {
            console.error('세션 삭제 에러:', err);
        }
        // 로그아웃 후 홈페이지로 리다이렉트
        res.redirect('/');
    });
});



app.listen(port, () => {
    console.log(`http://localhost:${port} 에서 애플리케이션이 실행 중입니다.`);
});
 
