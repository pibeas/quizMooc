var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto pertenece al usuario logeado o si es cuenta admin
exports.ownershipRequired = function(req, res, next){
    var objQuizOwner = req.quiz.UserId;
    var logUser = req.session.user.id;
    var isAdmin = req.session.user.isAdmin;

    if (isAdmin || objQuizOwner === logUser) {
        next();
    } else {
        res.redirect('/');
    }
};

// Autoload :id
exports.load = function(req, res, next, quizId) {
  	models.Quiz.findById(quizId).then(function(quiz) {
    	if (quiz) {
    		req.quiz = quiz;
        	next();
    	}else{
    		next(new Error('No existe quizId=' + quizId))
    	}
    }).catch(function(error){next(error)});
};

//GET /quizes/:id
exports.show = function(req, res) {
	res.render('quizes/show', { quiz: req.quiz, errors: []});
};

//GET /quizes/answer
exports.answer = function(req, res) {
	var resultado='Incorrecto';
	if  (req.query.respuesta.trim().toLowerCase() === req.quiz.respuesta.trim().toLowerCase()) {
		resultado='Correcto';
	}
	res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors: []});
};

//GET /quizes
exports.index = function(req, res, next) {
	var options = {};

	if (req.query.search !== undefined && req.query.tema !== undefined){
		 options.where = {
                      pregunta: {$ilike: '%'+req.query.search.replace(' ','%')+'%'},
                      tema: {$ilike: '%'+req.query.tema+'%'}
                    };
	} else if (req.query.search !== undefined){
      options.where = { pregunta: {$ilike: '%'+req.query.search.replace(' ','%')+'%'}};
  } else if (req.query.tema !== undefined){
      options.where = { tema: {$ilike: '%'+req.query.tema+'%'}};
  }


	models.Quiz.findAll(options).then(function(quizes){
		res.render('quizes/index.ejs', { quizes: quizes, errors: []});
	}).catch(function(error){next(error)});
};

// GET /quizes/new
exports.new = function(req, res) {
  var quiz = models.Quiz.build( // crea objeto quiz 
    {pregunta: "Pregunta", respuesta: "Respuesta", tema: "Tema"}
  );

  res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
  req.body.quiz.UserId = req.session.user.id;
 
  var quiz = models.Quiz.build( req.body.quiz );

  quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/new', {quiz: quiz, errors: err.errors});
      } else {
        quiz // save: guarda en DB campos pregunta y respuesta de quiz
        .save({fields: ["pregunta", "respuesta", "userId", "tema"]})
        .then( function(){ res.redirect('/quizes')}) 
      }      // res.redirect: Redirección HTTP a lista de preguntas
    }
  ).catch(function(error){next(error)});
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema = req.body.quiz.tema;

  req.quiz.validate().then(function(err){
  	if (err) {
    	res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
    } else {
    	req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas (URL relativo)
    }
  ).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
  req.quiz.destroy().then( function() {
    res.redirect('/quizes');
  }).catch(function(error){next(error)});
};