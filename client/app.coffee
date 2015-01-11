@editor = MandrillAce.getInstance()
logger = new Logger('app')

Meteor.startup(->
  @loginService = new LoginService()
  @loginService.setupTemplate()
  @notificationService = new NotificationService()
  @accountService = new AccountService()
)

Template.registerHelper('appName', -> 'MusitechHub')
Template.registerHelper('isLoggedIn', -> Meteor.userId()?)

class MenuElement
  constructor: (@name, @url) ->

  attrs: ->
    classes = ["menu-element"]
    if @isSelected()
      classes.push("pure-menu-selected")
    class:
      classes.join(" ")

  isSelected: ->
    if !Session.get("currentSection")?
      return
    Session.get("currentSection").toLowerCase() == @name.toLowerCase()

Template.layout.helpers(
  menuElements: -> [new MenuElement("Explore", "/"), new MenuElement("Create", "/create"),
    new MenuElement("About", "/about")]
)

class Accountbutton
  constructor: (icon, name) ->
    @icon = icon
    @name = name
    @klass = "enabled"

Template.accountbar.helpers({
  buttons: ->
    return [
      new Accountbutton('exit', 'logout')
    ]
})
