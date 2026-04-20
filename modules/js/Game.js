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

import { PlayerTurn } from "./PlayerTurn.js";
import {
  logStart,
  logEnd,
  getSortedPlayers,
  getPlayer,
  sortCards,
} from "./Functions.js";

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
          `tooltip of type : ${card.type}  ~ type_arg : ${card.type_arg} ~ id : ${card.id}`,
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
      let player = getPlayer(gamedatas, playerId);
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

      document.getElementById(
        `player_panel_content_${player.color}`,
      ).innerHTML = `
        <div id="otherhand_${player.id}" class="otherhand">
          <i class="fa fa-window-restore"></i>
        </div>
        `;
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

    // this.handStock.setSelectionMode("single");
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

    this.handStock.addCards(sortCards(Object.values(this.gamedatas.hand)));

    gamedatas.playerorder.forEach((playerId) => {
      let player = getPlayer(gamedatas, playerId);
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

    getSortedPlayers(gamedatas).forEach((player) => {
      // add player tableau stock
      this.tableauStocks[player.id] = new BgaCards.LineStock(
        this.cardsManager,
        document.getElementById(`tableau_${player.id}`),
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
    });

    // Hide hand zone from spectators
    if (this.isSpectator) {
      document.getElementById("myhand_wrap").style.display = "none";
    }

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
  async notif_newHand(args) {
    debugger;
    // We received a new full hand of 13 cards.
    this.handStock.removeAll();
    this.handStock.addCards(this.sortCards(args.cards));
    debugger;
  }

  async notif_playCard(args) {
    const playerId = args.player_id;
    let settings = {};
    if (playerId != this.player_id) {
      settings = {
        fromElement: $(`otherhand_${playerId}`),
        toPlaceholder: "grow",
      };
    }

    // Play a card on the table
    await this.tableauStocks[playerId].addCard(args.card, settings);
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

    // await this.tableauStocks[winner_id].addCards(cards);
    // await this.cardsManager.placeCards(cards);

    await this.tableauStocks[winner_id].addCards(cards);
    await this.tableauStocks[winner_id].removeCards(cards, {
      fadeOut: true,
      slideTo: $(`otherhand_${winner_id}`),
    });
  }
}
