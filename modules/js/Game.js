/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * tutorialrsptwo implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.js
 *
 * tutorialrsptwo user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

const BgaAnimations = await importEsmLib("bga-animations", "1.x");
const BgaCards = await importEsmLib("bga-cards", "1.x");

export class Game {
  constructor(bga) {
    console.log("tutorialrsptwo constructor");
    this.bga = bga;

    // Declare the State classes
    this.playerTurn = new PlayerTurn(this, bga);
    this.bga.states.register("PlayerTurn", this.playerTurn);

    // Here, you can init the global variables of your user interface
    // Example:
    // this.myGlobalValue = 0;
  }

  /*
        setup:
        
        This method must set up the game user interface according to current game situation specified
        in parameters.
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
        
        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */

  setup(gamedatas) {
    console.log("Starting game setup");
    this.gamedatas = gamedatas;

    // create the animation manager, and bind it to the `game.bgaAnimationsActive()` function
    this.animationManager = new BgaAnimations.Manager({
      animationsActive: () => this.bga.gameui.bgaAnimationsActive(),
    });

    const cardWidth = 100;
    const cardHeight = 135;

    // create the card manager
    this.cardsManager = new BgaCards.Manager({
      animationManager: this.animationManager,
      type: "ha-card", // the "type" of our cards in css
      getId: (card) => card.id,

      cardWidth: cardWidth,
      cardHeight: cardHeight,
      cardBorderRadius: "5%",
      setupFrontDiv: (card, div) => {
        div.dataset.type = card.type; // suit 1..4
        div.dataset.typeArg = card.type_arg; // value 2..14
        div.style.backgroundPositionX = `calc(100% / 14 * (${card.type_arg} - 2))`; // 14 is number of columns in stock image minus 1
        div.style.backgroundPositionY = `calc(100% / 3 * (${card.type} - 1))`; // 3 is number of rows in stock image minus 1
        this.bga.gameui.addTooltipHtml(
          div.id,
          `tooltip of type : ${card.type} ~ id : ${card.id}`,
        );
      },
    });

    // Example to add a div on the game area
    this.bga.gameArea.getElement().insertAdjacentHTML(
      "beforeend",
      `
            <div id="player-tables"></div>
        `,
    );

    // Setting up player boards
    const numPlayers = Object.keys(gamedatas.players).length;

    gamedatas.playerorder.forEach((playerId, index) => {
      let player = this.getPlayer(gamedatas, playerId);
      debugger;

      // we generate this html snippet for each player
      // need to tweak so that divs are displayed so as to make sense i.e. first player at top of screen,
      // then next to right, next at bottom and last on the left
      // look at playerorder in gamesdatas
      document.getElementById("player-tables").insertAdjacentHTML(
        "beforeend",
        `
          <div class="playertable whiteblock playertable_${index}">
            <div class="playertablename" style="color:#${player.color};">${player.name}~${player.id}¬${index}</div>
            <div id="tableau_${player.id}"/></div>
            <div id="cardswon_${player.id}"/></div>
          </div>
    `,
      );
    });

    this.bga.gameArea.getElement().insertAdjacentHTML(
      "beforeend",
      `
                <div id="myhand_wrap" class="whiteblock">
                    <b id="myhand_label">${_("My hand")}</b>
                        <div id="myhand">
                        </div>
                    </div>

            `,
    );
    // create the stock, in the game setup
    this.handStock = new BgaCards.HandStock(
      this.cardsManager,
      document.getElementById("myhand"),
    );

    this.handStock.setSelectionMode("single");
    this.handStock.onCardClick = (card) => {
      {
        console.log("onCardClick : card ", card);
        console.log("onCardClick : namestate ", this.gamedatas.gamestate.name);
        if (!card) return; // hmm - should never happen
        switch (this.gamedatas.gamestate.name) {
          case "PlayerTurn":
            // Can play a card
            this.bga.actions.performAction("actPlayCard", { cardId: card.id });

            break;
          case "GiveCards":
            // Can give cards TODO
            break;
          default: {
            this.handStock.unselectAll();
            break;
          }
        }
      }
    };

    // TODO: fix handStock
    console.log("fix hand stock");

    this.handStock.addCards(
      Object.values(this.gamedatas.hand).sort(function (a, b) {
        // sort by suit then rank
        if (a.type === b.type) {
          // sub sort by rank
          return parseInt(a.type_arg) - parseInt(b.type_arg);
        } else {
          // sort by suit
          return parseInt(a.type) - parseInt(b.type);
        }
      }),
    );
    gamedatas.playerorder.forEach((playerId) => {
      let player = this.getPlayer(gamedatas, playerId);
      // example of setting up players boards
      this.bga.playerPanels.getElement(player.id).insertAdjacentHTML(
        "beforeend",
        `
            <span id="energy-player-counter-${player.id}"></span> Energy
        `,
      );
      const counter = new ebg.counter();
      counter.create(`energy-player-counter-${player.id}`, {
        value: player.energy,
        playerCounter: "energy",
        playerId: player.id,
      });
    });

    this.tableauStocks = [];

    gamedatas.playerorder.forEach((playerId) => {
      let player = this.getPlayer(gamedatas, playerId);
      // add player tableau stock
      this.tableauStocks[player.id] = new BgaCards.LineStock(
        this.cardsManager,
        document.getElementById(`tableau_${player.id}`),
      );

      // add void stock - need a div!
      console.log("add void stock");
      new BgaCards.VoidStock(
        this.cardsManager,
        document.getElementById(`cardswon_${player.id}`),
        {
          autoPlace: (card) =>
            card.location === "cardswon" && card.location_arg == player.id,
        },
      );

      // Cards played on table
      for (i in this.gamedatas.cardsontable) {
        var card = this.gamedatas.cardsontable[i];
        var player_id = card.location_arg;
        console.log("player id ", player.id);
        console.log("tableauStocks  ", this.tableauStocks);
        console.log("tableauStocks  ", this.tableauStocks[player.id]);

        this.tableauStocks[player.id].addCards([card]);
      }

      debugger;
    });

    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();

    console.log("Ending game setup");
  }

  getPlayer(gamedatas, playerId) {
    return Object.values(gamedatas.players).filter(
      (player) => player.id == playerId,
    )[0];
  }

  ///////////////////////////////////////////////////
  //// Utility methods

  /*
    
        Here, you can defines some utility methods that you can use everywhere in your javascript
        script. Typically, functions that are used in multiple state classes or outside a state class.
    
    */

  ///////////////////////////////////////////////////
  //// Reaction to cometD notifications

  /*
        setupNotifications:
        
        In this method, you associate each of your game notifications with your local method to handle it.
        
        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your tutorialrsptwo.game.php file.
    
    */
  setupNotifications() {
    console.log("notifications subscriptions setup");

    // automatically listen to the notifications, based on the `notif_xxx` function on this class.
    // Uncomment the logger param to see debug information in the console about notifications.
    this.bga.notifications.setupPromiseNotifications({
      // logger: console.log
    });
  }

  // TODO: from this point and below, you can write your game notifications handling methods
  async notif_newHand(args) {
    debugger;
    // We received a new full hand of 13 cards.
    this.handStock.removeAll();
    this.handStock.addCards(Array.from(Object.values(args.hand)));
  }

  async notif_playCard(args) {
    // Play a card on the table
    this.tableauStocks[args.player_id].addCards([args.card]);
  }

  async notif_xxx(args) {
    console.log("notif_xxxCard", args);
  }

  async notif_trickWin(args) {
    // We do nothing here (just wait in order players can view the 4 cards played before they're gone)
  }

  async notif_giveAllCardsToPlayer(args) {
    // Move all cards on table to given table, then destroy them
    const winner_id = args.player_id;
    const cards = Array.from(Object.values(args.cards));

    await this.tableauStocks[winner_id].addCards(cards);
    await this.cardsManager.placeCards(cards); // auto-placement
  }
}

/**
 * We create one State class per declared state on the PHP side, to handle all state specific code here.
 * onEnteringState, onLeavingState and onPlayerActivationChange are predefined names that will be called by the framework.
 * When executing code in this state, you can access the args using this.args
 */
class PlayerTurn {
  constructor(game, bga) {
    this.game = game;
    this.bga = bga;
  }

  /**
   * This method is called each time we are entering the game state. You can use this method to perform some user interface changes at this moment.
   */
  onEnteringState(args, isCurrentPlayerActive) {
    this.bga.statusBar.setTitle(
      isCurrentPlayerActive
        ? _("${you} must play a card or pass")
        : _("${actplayer} must play a card or pass"),
    );

    if (isCurrentPlayerActive) {
      const playableCardsIds = args.playableCardsIds; // returned by the PlayerTurn::getArgs

      // Add test action buttons in the action status bar, simulating a card click:
      playableCardsIds.forEach((cardId) =>
        this.bga.statusBar.addActionButton(
          _("Play card with id ${card_id}").replace("${card_id}", cardId),
          () => this.onCardClick(cardId),
        ),
      );

      this.bga.statusBar.addActionButton(
        _("Pass"),
        () => this.bga.actions.performAction("actPass"),
        { color: "secondary" },
      );
    }
  }

  /**
   * This method is called each time we are leaving the game state. You can use this method to perform some user interface changes at this moment.
   */
  onLeavingState(args, isCurrentPlayerActive) {}

  /**
   * This method is called each time the current player becomes active or inactive in a MULTIPLE_ACTIVE_PLAYER state. You can use this method to perform some user interface changes at this moment.
   * on MULTIPLE_ACTIVE_PLAYER states, you may want to call this function in onEnteringState using `this.onPlayerActivationChange(args, isCurrentPlayerActive)` at the end of onEnteringState.
   * If your state is not a MULTIPLE_ACTIVE_PLAYER one, you can delete this function.
   */
  onPlayerActivationChange(args, isCurrentPlayerActive) {}

  onCardClick(card_id) {
    console.log("onCardClick", card_id);

    this.bga.actions
      .performAction("actPlayCard", { cardId: card_id })
      .then(() => {
        // What to do after the server call if it succeeded
        // (most of the time, nothing, as the game will react to notifs / change of state instead, so you can delete the `then`)
      });
  }
}
