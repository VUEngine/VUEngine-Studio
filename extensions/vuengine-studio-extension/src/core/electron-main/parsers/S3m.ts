// @ts-nocheck

// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.S3m = factory(root.KaitaiStream);
  }
}(typeof self !== 'undefined' ? self : this, function (KaitaiStream) {
  /**
   * Scream Tracker 3 module is a tracker music file format that, as all
   * tracker music, bundles both sound samples and instructions on which
   * notes to play. It originates from a Scream Tracker 3 music editor
   * (1994) by Future Crew, derived from original Scream Tracker 2 (.stm)
   * module format.
   * 
   * Instrument descriptions in S3M format allow to use either digital
   * samples or setup and control AdLib (OPL2) synth.
   * 
   * Music is organized in so called `patterns`. "Pattern" is a generally
   * a 64-row long table, which instructs which notes to play on which
   * time measure. "Patterns" are played one-by-one in a sequence
   * determined by `orders`, which is essentially an array of pattern IDs
   * - this way it's possible to reuse certain patterns more than once
   * for repetitive musical phrases.
   * @see {@link http://hackipedia.org/browse.cgi/File%20formats/Music%20tracker/S3M%2c%20ScreamTracker%203/Scream%20Tracker%203.20%20by%20Future%20Crew.txt|Source}
   */

  var S3m = (function () {
    function S3m(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    S3m.prototype._read = function () {
      this.songName = KaitaiStream.bytesTerminate(this._io.readBytes(28), 0, false);
      this.magic1 = this._io.readBytes(1);
      if (!((KaitaiStream.byteArrayCompare(this.magic1, [26]) == 0))) {
        throw new KaitaiStream.ValidationNotEqualError([26], this.magic1, this._io, "/seq/1");
      }
      this.fileType = this._io.readU1();
      this.reserved1 = this._io.readBytes(2);
      this.numOrders = this._io.readU2le();
      this.numInstruments = this._io.readU2le();
      this.numPatterns = this._io.readU2le();
      this.flags = this._io.readU2le();
      this.version = this._io.readU2le();
      this.samplesFormat = this._io.readU2le();
      this.magic2 = this._io.readBytes(4);
      if (!((KaitaiStream.byteArrayCompare(this.magic2, [83, 67, 82, 77]) == 0))) {
        throw new KaitaiStream.ValidationNotEqualError([83, 67, 82, 77], this.magic2, this._io, "/seq/10");
      }
      this.globalVolume = this._io.readU1();
      this.initialSpeed = this._io.readU1();
      this.initialTempo = this._io.readU1();
      this.isStereo = this._io.readBitsIntBe(1) != 0;
      this.masterVolume = this._io.readBitsIntBe(7);
      this._io.alignToByte();
      this.ultraClickRemoval = this._io.readU1();
      this.hasCustomPan = this._io.readU1();
      this.reserved2 = this._io.readBytes(8);
      this.ofsSpecial = this._io.readU2le();
      this.channels = [];
      for (var i = 0; i < 32; i++) {
        this.channels.push(new Channel(this._io, this, this._root));
      }
      this.orders = this._io.readBytes(this.numOrders);
      this.instruments = [];
      for (var i = 0; i < this.numInstruments; i++) {
        this.instruments.push(new InstrumentPtr(this._io, this, this._root));
      }
      this.patterns = [];
      for (var i = 0; i < this.numPatterns; i++) {
        this.patterns.push(new PatternPtr(this._io, this, this._root));
      }
      if (this.hasCustomPan == 252) {
        this.channelPans = [];
        for (var i = 0; i < 32; i++) {
          this.channelPans.push(new ChannelPan(this._io, this, this._root));
        }
      }
    }

    var ChannelPan = S3m.ChannelPan = (function () {
      function ChannelPan(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      ChannelPan.prototype._read = function () {
        this.reserved1 = this._io.readBitsIntBe(2);
        this.hasCustomPan = this._io.readBitsIntBe(1) != 0;
        this.reserved2 = this._io.readBitsIntBe(1) != 0;
        this.pan = this._io.readBitsIntBe(4);
      }

      /**
       * If true, then use a custom pan setting provided in the `pan`
       * field. If false, the channel would use the default setting
       * (0x7 for mono, 0x3 or 0xc for stereo).
       */

      return ChannelPan;
    })();

    var PatternCell = S3m.PatternCell = (function () {
      function PatternCell(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      PatternCell.prototype._read = function () {
        this.hasFx = this._io.readBitsIntBe(1) != 0;
        this.hasVolume = this._io.readBitsIntBe(1) != 0;
        this.hasNoteAndInstrument = this._io.readBitsIntBe(1) != 0;
        this.channelNum = this._io.readBitsIntBe(5);
        this._io.alignToByte();
        if (this.hasNoteAndInstrument) {
          this.note = this._io.readU1();
        }
        if (this.hasNoteAndInstrument) {
          this.instrument = this._io.readU1();
        }
        if (this.hasVolume) {
          this.volume = this._io.readU1();
        }
        if (this.hasFx) {
          this.fxType = this._io.readU1();
        }
        if (this.hasFx) {
          this.fxValue = this._io.readU1();
        }
      }

      return PatternCell;
    })();

    var PatternCells = S3m.PatternCells = (function () {
      function PatternCells(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      PatternCells.prototype._read = function () {
        this.cells = [];
        var i = 0;
        while (!this._io.isEof()) {
          this.cells.push(new PatternCell(this._io, this, this._root));
          i++;
        }
      }

      return PatternCells;
    })();

    var Channel = S3m.Channel = (function () {
      function Channel(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      Channel.prototype._read = function () {
        this.isDisabled = this._io.readBitsIntBe(1) != 0;
        this.chType = this._io.readBitsIntBe(7);
      }

      /**
       * Channel type (0..7 = left sample channels, 8..15 = right sample channels, 16..31 = AdLib synth channels)
       */

      return Channel;
    })();

    /**
     * Custom 3-byte integer, stored in mixed endian manner.
     */

    var SwappedU3 = S3m.SwappedU3 = (function () {
      function SwappedU3(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      SwappedU3.prototype._read = function () {
        this.hi = this._io.readU1();
        this.lo = this._io.readU2le();
      }
      Object.defineProperty(SwappedU3.prototype, 'value', {
        get: function () {
          if (this._m_value !== undefined)
            return this._m_value;
          this._m_value = (this.lo | (this.hi << 16));
          return this._m_value;
        }
      });

      return SwappedU3;
    })();

    var Pattern = S3m.Pattern = (function () {
      function Pattern(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      Pattern.prototype._read = function () {
        this.size = this._io.readU2le();
        this._raw_body = this._io.readBytes((this.size - 2));
        var _io__raw_body = new KaitaiStream(this._raw_body);
        this.body = new PatternCells(_io__raw_body, this, this._root);
      }

      return Pattern;
    })();

    var PatternPtr = S3m.PatternPtr = (function () {
      function PatternPtr(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      PatternPtr.prototype._read = function () {
        this.paraptr = this._io.readU2le();
      }
      Object.defineProperty(PatternPtr.prototype, 'body', {
        get: function () {
          if (this._m_body !== undefined)
            return this._m_body;
          var _pos = this._io.pos;
          this._io.seek((this.paraptr * 16));
          this._m_body = new Pattern(this._io, this, this._root);
          this._io.seek(_pos);
          return this._m_body;
        }
      });

      return PatternPtr;
    })();

    var InstrumentPtr = S3m.InstrumentPtr = (function () {
      function InstrumentPtr(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      InstrumentPtr.prototype._read = function () {
        this.paraptr = this._io.readU2le();
      }
      Object.defineProperty(InstrumentPtr.prototype, 'body', {
        get: function () {
          if (this._m_body !== undefined)
            return this._m_body;
          var _pos = this._io.pos;
          this._io.seek((this.paraptr * 16));
          this._m_body = new Instrument(this._io, this, this._root);
          this._io.seek(_pos);
          return this._m_body;
        }
      });

      return InstrumentPtr;
    })();

    var Instrument = S3m.Instrument = (function () {
      Instrument.InstTypes = Object.freeze({
        SAMPLE: 1,
        MELODIC: 2,
        BASS_DRUM: 3,
        SNARE_DRUM: 4,
        TOM: 5,
        CYMBAL: 6,
        HIHAT: 7,

        1: "SAMPLE",
        2: "MELODIC",
        3: "BASS_DRUM",
        4: "SNARE_DRUM",
        5: "TOM",
        6: "CYMBAL",
        7: "HIHAT",
      });

      function Instrument(_io, _parent, _root) {
        this._io = _io;
        this._parent = _parent;
        this._root = _root || this;

        this._read();
      }
      Instrument.prototype._read = function () {
        this.type = this._io.readU1();
        this.filename = KaitaiStream.bytesTerminate(this._io.readBytes(12), 0, false);
        switch (this.type) {
          case S3m.Instrument.InstTypes.SAMPLE:
            this.body = new Sampled(this._io, this, this._root);
            break;
          default:
            this.body = new Adlib(this._io, this, this._root);
            break;
        }
        this.tuningHz = this._io.readU4le();
        this.reserved2 = this._io.readBytes(12);
        this.sampleName = KaitaiStream.bytesTerminate(this._io.readBytes(28), 0, false);
        this.magic = this._io.readBytes(4);
        if (!((KaitaiStream.byteArrayCompare(this.magic, [83, 67, 82, 83]) == 0))) {
          throw new KaitaiStream.ValidationNotEqualError([83, 67, 82, 83], this.magic, this._io, "/types/instrument/seq/6");
        }
      }

      var Sampled = Instrument.Sampled = (function () {
        function Sampled(_io, _parent, _root) {
          this._io = _io;
          this._parent = _parent;
          this._root = _root || this;

          this._read();
        }
        Sampled.prototype._read = function () {
          this.paraptrSample = new SwappedU3(this._io, this, this._root);
          this.lenSample = this._io.readU4le();
          this.loopBegin = this._io.readU4le();
          this.loopEnd = this._io.readU4le();
          this.defaultVolume = this._io.readU1();
          this.reserved1 = this._io.readU1();
          this.isPacked = this._io.readU1();
          this.flags = this._io.readU1();
        }
        Object.defineProperty(Sampled.prototype, 'sample', {
          get: function () {
            if (this._m_sample !== undefined)
              return this._m_sample;
            var _pos = this._io.pos;
            this._io.seek((this.paraptrSample.value * 16));
            this._m_sample = this._io.readBytes(this.lenSample);
            this._io.seek(_pos);
            return this._m_sample;
          }
        });

        /**
         * Default volume
         */

        /**
         * 0 = unpacked, 1 = DP30ADPCM packing
         */

        return Sampled;
      })();

      var Adlib = Instrument.Adlib = (function () {
        function Adlib(_io, _parent, _root) {
          this._io = _io;
          this._parent = _parent;
          this._root = _root || this;

          this._read();
        }
        Adlib.prototype._read = function () {
          this.reserved1 = this._io.readBytes(3);
          if (!((KaitaiStream.byteArrayCompare(this.reserved1, [0, 0, 0]) == 0))) {
            throw new KaitaiStream.ValidationNotEqualError([0, 0, 0], this.reserved1, this._io, "/types/instrument/types/adlib/seq/0");
          }
          this._unnamed1 = this._io.readBytes(16);
        }

        return Adlib;
      })();

      return Instrument;
    })();

    /**
     * Number of orders in a song
     */

    /**
     * Number of instruments in a song
     */

    /**
     * Number of patterns in a song
     */

    /**
     * Scream Tracker version that was used to save this file
     */

    /**
     * 1 = signed samples, 2 = unsigned samples
     */

    /**
     * Offset of special data, not used by Scream Tracker directly.
     */

    return S3m;
  })();
  return S3m;
}));
