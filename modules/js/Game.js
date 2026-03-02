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
import { PlayerTurn } from "./PlayerTurn.js";
export class Game {
  constructor(bga) {
    console.log("tutorialrsptwo constructor");
    this.bga = bga;

    // Declare the State classes
    this.playerTurn = new PlayerTurn(this, bga);
    this.bga.states.register("PlayerTurn", this.playerTurn);

    // Uncomment the next line to show debug informations about state changes in the console. Remove before going to production!
    // this.bga.states.logger = console.log;

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
        this.bga.gameui.addTooltipHtml(div.id, `tooltip of ${card.type}`);
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
    debugger;
    Object.values(gamedatas.players).forEach((player, index) => {
      document.getElementById("player-tables").insertAdjacentHTML(
        "beforeend",
        // we generate this html snippet for each player
        `
    <div class="playertable whiteblock playertable_${index}">
        <div class="playertablename" style="color:#${player.color};">${player.name}</div>
        <div id="tableau_${player.id}"></div>
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
      this.tableauStocks[card.location_arg].addCards([card]);
    };

    // TODO: fix handStock
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
    debugger;

    Object.values(gamedatas.players).forEach((player) => {
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
    debugger;

    Object.values(gamedatas.players).forEach((player, index) => {
      // add player tableau stock
      this.tableauStocks[player.id] = new BgaCards.LineStock(
        this.cardsManager,
        document.getElementById(`tableau_${player.id}`),
      );

      // TODO: fix tableauStocks
      // Cards played on table
      for (i in this.gamedatas.cardsontable) {
        var card = this.gamedatas.cardsontable[i];
        var player_id = card.location_arg;
        this.tableauStocks[player_id].addCards([card]);
      }
    });

    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();

    console.log("Ending game setup");
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

  /*
    Example:
    async notif_cardPlayed( args ) {
        // Note: args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
        
        // TODO: play the card in the user interface.
    }
    */
}
