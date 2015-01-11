logger = new Logger('routing')

Router.configure(
  layoutTemplate: 'layout'
)
Router.route('/', ->
  @render('explore')
)
Router.route('/account/forgotpassword', ->
  @render('forgotPassword')
,
  name: 'forgotPassword',
)
Router.route('/about', ->
  @render('about')
)
Router.route('/create', ->
  @render('create')
)
Router.route('/:owner/:project', ->
  @render("project")
,
  controller: ProjectController,
)
Router.onBeforeAction(->
  if !Meteor.userId()?
    logger.debug('User not logged in, rendering login page')
    @render('login')
  else
    if @url.startsWith('/account')
      curSection = "account"
    else if @url.startsWith("/create")
      curSection = "create"
    else if @url.startsWith("/about")
      curSection = "about"
    else
      curSection = "explore"
    Session.set("currentSection", curSection)

    logger.debug('User is authenticated')
    @next()
, {
  except: ['forgotPassword',]
})
