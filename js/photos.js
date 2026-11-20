// Documentary photographs, listed in reading order.
const archivePhotos = {
  "patagonia": [
    {
      "caption": "Ивон Шуинар. Снимок альпиниста и фотографа Тома Фроста.",
      "credit": "Tom Frost",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Yvon_Chouinard_by_Tom_Frost.jpg",
      "width": 400,
      "height": 580
    },
    {
      "caption": "Съёмные шестиугольные закладки. Их форма позволяет закрепиться в трещине скалы.",
      "credit": "Thomas Gehrlein",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Klettern-hexentrics-2.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "nike": [
    {
      "caption": "Ранние беговые Nike Moon Shoe, выставленные на аукционе Sotheby’s.",
      "credit": "Jordan Geller",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Nike_Moon_Shoe_Sotheby%27s.jpg",
      "width": 960,
      "height": 640
    },
    {
      "caption": "Фил Найт и Билл Бауэрман, сооснователи Blue Ribbon Sports.",
      "credit": "University of Oregon",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Knight_and_Bowerman.jpg",
      "width": 960,
      "height": 931
    }
  ],
  "kodak": [
    {
      "caption": "Плёночная камера Kodak Beau Brownie. Коробочная конструкция оставляла фотографу минимум настроек.",
      "credit": "George Rex from London, England",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:My_Beau_Brownie_-_-2_(10101294333).jpg",
      "width": 729,
      "height": 1100
    },
    {
      "caption": "Цифровая система Kodak DCS с камерой Nikon F3 на выставке CP+.",
      "credit": "Morio",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Kodak_DCS_system_and_Nikon_F3_2014_CP%2B.jpg",
      "width": 960,
      "height": 640
    }
  ],
  "dodo": [
    {
      "caption": "Пиццерия «Додо Пицца» в Эжве. Фотография компании.",
      "credit": "Dodo Pizza World",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Dodo-pizza-ezhva_14790132169_o_(30887182880).jpg",
      "width": 960,
      "height": 641
    },
    {
      "caption": "Одна из пиццерий сети «Додо».",
      "credit": "Dodo Pizza World",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Dodo_Ext_5.jpeg",
      "width": 960,
      "height": 640
    }
  ],
  "mac": [
    {
      "caption": "Стив Джобс с компьютером Macintosh в январе 1984 года. Фотография Бернарда Готфрида.",
      "credit": "Photo: Bernard Gotfryd - Edited from tif by Cart",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Steve_Jobs_and_Macintosh_computer,_January_1984,_by_Bernard_Gotfryd_-_edited.jpg",
      "width": 747,
      "height": 1100
    },
    {
      "caption": "Мышь Apple Macintosh M0100 с одной кнопкой.",
      "credit": "raneko",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Apple_Macintosh_Mouse_M0100.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "wework": [
    {
      "caption": "Пространство WeWork в Salesforce Tower в Сан-Франциско.",
      "credit": "Mx. Granger",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:WeWork_-_Salesforce_Tower.jpg",
      "width": 960,
      "height": 721
    },
    {
      "caption": "Здание WeWork на улице Флорида в Буэнос-Айресе.",
      "credit": "Lombardia1",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:WeWork_Building_in_Florida,_Buenos_Aires.jpg",
      "width": 785,
      "height": 1100
    }
  ],
  "habits": [
    {
      "caption": "Джеймс Клир выступает на симпозиуме в Санкт-Галлене в 2010 году.",
      "credit": "James Clear",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:James_Clear_in_2010.jpg",
      "width": 381,
      "height": 517
    },
    {
      "caption": "Страница бумажного bullet journal. Пример того, как можно фиксировать небольшие действия.",
      "credit": "Nea.salo",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Bullet_journal_page.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "money": [
    {
      "caption": "Копилка как знакомый предмет повседневных сбережений. Фотография по теме книги.",
      "credit": "Ken Teegardin from Boulder, Boulder",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Pink_Piggy_Bank_(5737823348).jpg",
      "width": 960,
      "height": 812
    },
    {
      "caption": "Разговор о сбережениях и долгах на семинаре с финансовым автором Келвином Бостоном. Иллюстрация темы книги.",
      "credit": "U.S. Navy photo by Mass Communication Specialist Seaman Michael Calloway",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:US_Navy_071011-N-4918C-065_Kelvin_Boston,_financial_advisor_and_author_of_the_book,_%22Who%27s_Afraid_To_Be_A_Millionaire,%22_explains_to_Sailors_the_importance_of_saving_money_and_avoiding_debt,_during_a_seminar_held_abo.jpg",
      "width": 736,
      "height": 1100
    }
  ],
  "zero": [
    {
      "caption": "Питер Тиль, соавтор книги «От нуля к единице».",
      "credit": "Dan Taylor",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Peter_Thiel_by_Dan_Taylor.jpg",
      "width": 960,
      "height": 641
    },
    {
      "caption": "Блейк Мастерс, соавтор книги и автор записей курса.",
      "credit": "Gage Skidmore from Surprise, AZ, United States of America",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Blake_Masters_(52291378835)_(cropped).jpg",
      "width": 926,
      "height": 1100
    }
  ],
  "focus": [
    {
      "caption": "Читальный зал университетской библиотеки в Граце. Пример места для сосредоточенной работы.",
      "credit": "Dr. Marcus Gossler",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Graz_University-Library_reading-room.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Рабочие места в читальном зале библиотеки Джона Райландса, Манчестер.",
      "credit": "Reading room at John Rylands Library by Eirian Evans",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Reading_room_at_John_Rylands_Library_-_geograph.org.uk_-_6362331.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "lego": [
    {
      "caption": "Кирпичики LEGO в LEGO House в Биллунне.",
      "credit": "Leif Jørgensen",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Lego_bricks_in_Lego_House.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Литьевая машина в LEGO House. На таком типе оборудования изготавливают пластиковые детали.",
      "credit": "Leif Jørgensen",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Casting_machine_in_Lego_House_02.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "ikea": [
    {
      "caption": "Музей IKEA в Эльмхульте, Швеция.",
      "credit": "Lesnydzban",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:IKEA_Museum,_%C3%84lmhult.jpg",
      "width": 960,
      "height": 492
    },
    {
      "caption": "Секция плоских упаковок в магазине IKEA в Канберре.",
      "credit": "Nick-D",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Flat_pack_section_of_IKEA_Canberra_April_2026.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "toyota": [
    {
      "caption": "Автоматический ткацкий станок Toyoda Type G образца 1924 года.",
      "credit": "Morio",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "source": "https://commons.wikimedia.org/wiki/File:1924_Non-Stop_Shuttle_Change_Toyoda_Automatic_Loom,_Type_G_1.jpg",
      "width": 960,
      "height": 776
    },
    {
      "caption": "Реплика седана Toyoda AA в автомобильном музее Toyota.",
      "credit": "NearEMPTiness",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Toyoda_Modell_AA_(Replica),_1936_(Japan)_in_the_Toyota_Automobile_Museum.JPG",
      "width": 960,
      "height": 720
    }
  ],
  "sony": [
    {
      "caption": "Оригинальный кассетный Sony Walkman TPS-L2.",
      "credit": "Binarysequence",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Original_Sony_Walkman_TPS-L2.JPG",
      "width": 693,
      "height": 1100
    },
    {
      "caption": "Корпус оригинального Sony TPS-L2 перед разборкой. Видны боковая панель и органы управления.",
      "credit": "Dave Jones from Australia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Original_1979_Sony_TPS-L2_Walkman_Teardown_(18667686211).jpg",
      "width": 693,
      "height": 1100
    }
  ],
  "nintendo": [
    {
      "caption": "Оригинальная портативная консоль Nintendo Game Boy.",
      "credit": "Evan-Amos",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Game-Boy-Original.jpg",
      "width": 687,
      "height": 1100
    },
    {
      "caption": "Game Boy рядом с картриджем Tetris. Сменный носитель расширял возможности одной консоли.",
      "credit": "Studio Alijn",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Game_Boy_with_Tetris_cartridge.jpg",
      "width": 960,
      "height": 719
    }
  ],
  "honda": [
    {
      "caption": "Honda Super Cub C100 в японской музейной коллекции.",
      "credit": "先従隗始",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Honda_Super_Cub_C100_(23110313202).jpg",
      "width": 960,
      "height": 640
    },
    {
      "caption": "Тот же Super Cub с другого ракурса. Видны посадка и форма защитного щитка.",
      "credit": "先従隗始",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Honda_Super_Cub_C100_(23031013550).jpg",
      "width": 960,
      "height": 640
    }
  ],
  "ferrari": [
    {
      "caption": "Ferrari 125 в Пескаре в 1947 году. Архивная фотография.",
      "credit": "Unknown photographer",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:1947-08-15_Pescara_Ferrari_125_sn02C_Cortese_front.jpg",
      "width": 581,
      "height": 760
    },
    {
      "caption": "Энцо Феррари с Дино и Нандо Ригетти рядом с 125 S в 1947 году.",
      "credit": "Unknown photographer",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:1947-08-01_Ferrari_125_01C_Enzo_Dino_Nando.jpg",
      "width": 916,
      "height": 618
    }
  ],
  "levis": [
    {
      "caption": "Медная заклёпка в углу кармана джинсов, крупный план.",
      "credit": "Marcos André",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Closeup_of_copper_rivet_on_jeans.jpg",
      "width": 800,
      "height": 532
    },
    {
      "caption": "Леви Страусс, торговец из Сан-Франциско и партнёр портного Джейкоба Дэвиса.",
      "credit": "Unknown author Unknown author",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Levi_Strauss_1.jpg",
      "width": 960,
      "height": 1095
    }
  ],
  "michelin": [
    {
      "caption": "Красные гиды Michelin разных лет в коллекции ресторана Pic в Валансе.",
      "credit": "Patrick Gaudin",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Guides_Michelin_Collection_du_restaurant_Pic_%C3%A0_Valence_d%C3%A8s_les_ann%C3%A9es_1930.jpg",
      "width": 960,
      "height": 636
    },
    {
      "caption": "Дорожный указатель Michelin в Монлуи-сюр-Луар. Бренд помогал автомобилисту ориентироваться и на местности.",
      "credit": "Daniel Jolivet",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Borne_cubique_Michelin_Montlouis-sur-Loire.jpg",
      "width": 960,
      "height": 636
    }
  ],
  "polaroid": [
    {
      "caption": "Камера Polaroid Land Model 95 в футляре.",
      "credit": "Joe Haupt from USA",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Vintage_Polaroid_Land_Model_95_Instant_Camera_In_Case,_The_First_Polaroid_Model,_Made_In_USA,_Circa_1948_-_1953_(35884494665).jpg",
      "width": 857,
      "height": 1100
    },
    {
      "caption": "Складная Polaroid SX-70 Land Camera Model 2.",
      "credit": "Jonathan Mauer",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Polaroid_SX-70_Land_Camera_model_2_instant_camera.jpg",
      "width": 960,
      "height": 816
    }
  ],
  "steinway": [
    {
      "caption": "Концертный рояль Steinway & Sons D-274, изготовленный в Гамбурге.",
      "credit": "\"Photo: © Copyright Steinway & Sons\"",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Steinway_%26_Sons_concert_grand_piano,_model_D-274,_manufactured_at_Steinway%27s_factory_in_Hamburg,_Germany_cropped.jpg",
      "width": 960,
      "height": 819
    },
    {
      "caption": "Клавиатура рояля Steinway & Sons гамбургской фабрики.",
      "credit": "User:Fanoftheworld",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Keyboard_of_grand_piano_-_Steinway_%26_Sons_(Hamburg_factory).jpg",
      "width": 765,
      "height": 1100
    }
  ],
  "starbucks": [
    {
      "caption": "Магазин Starbucks у Pike Place Market в Сиэтле. Снимок примерно 1977 года.",
      "credit": "Pike Place Market",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Pike_Place_Market_-_Starbucks_circa_1977.jpg",
      "width": 960,
      "height": 652
    },
    {
      "caption": "Магазин по адресу 1912 Pike Place.",
      "credit": "SilentDeath",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Starbucks_Seattle_PikePlace_1912.jpg",
      "width": 960,
      "height": 640
    }
  ],
  "braun": [
    {
      "caption": "Радиопроигрыватель Braun SK 4.1 конструкции Ханса Гугелота и Дитера Рамса.",
      "credit": "With Associates",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Braun_SK_4.1.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Дитер Рамс в Бостоне в 2005 году.",
      "credit": "Bharani Padmanabhan MD PhD ( en:user:scleroplex )",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Dieter-rams-boston2005-001.jpg",
      "width": 525,
      "height": 715
    }
  ],
  "hermes": [
    {
      "caption": "Парижский дом Hermès по адресу 24, rue du Faubourg-Saint-Honoré.",
      "credit": "Polymagou",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Herm%C3%A8s,_24_rue_du_Faubourg-Saint-Honor%C3%A9,_Paris_8e_4-1.jpg",
      "width": 880,
      "height": 1100
    },
    {
      "caption": "Шёлковый платок Hermès в витрине лондонского магазина.",
      "credit": "Metro Centric",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Herm%C3%A8s_silk_scarf_in_shop_window_in_London.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "adidas": [
    {
      "caption": "Футбольные бутсы adidas игрока Дуга Итьера, сезон 1999 года.",
      "credit": "Ithier10",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:1999-06-08_Doug_Ithier%27s_Adidas_Boots.jpg",
      "width": 800,
      "height": 556
    },
    {
      "caption": "Бутсы adidas и футбольный мяч. Более поздняя экипировка показывает дальнейшее развитие категории.",
      "credit": "C Ling Fan from Kuala Lumpur, Malaysia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Adidas_football_and_boots.jpg",
      "width": 375,
      "height": 500
    }
  ],
  "faberge": [
    {
      "caption": "Пасхальное яйцо Фаберже «Курочка».",
      "credit": "Михаил Овчинников",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:%D0%AF%D0%B9%D1%86%D0%BE_%22%D0%9A%D1%83%D1%80%D0%BE%D1%87%D0%BA%D0%B0%22.JPG",
      "width": 960,
      "height": 638
    },
    {
      "caption": "Яйцо Фаберже «Екатерина Великая» в музее Хиллвуд. Другой предмет императорской серии.",
      "credit": "ctj71081",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Catherine_the_Great_Easter_Egg_(Faberg%C3%A9_egg)_at_the_Hillwood_Museum_%26_Gardens_(7355676370).jpg",
      "width": 960,
      "height": 641
    }
  ],
  "edsel": [
    {
      "caption": "Ford Edsel Pacer. Хорошо видна характерная вертикальная решётка радиатора.",
      "credit": "ArildV",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Edsel_Pacer_August_2025_01.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Органы управления Teletouch на руле Edsel Citation 1958 года.",
      "credit": "Greg Gjerdingen from Willmar, USA",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:1958_Edsel_Citation_Teletouch_Transmission_(18997339216).jpg",
      "width": 960,
      "height": 639
    }
  ],
  "delorean": [
    {
      "caption": "DeLorean DMC-12 1981 года. Хорошо видна неокрашенная поверхность кузова.",
      "credit": "Sicnag",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:1981_Delorean_DMC-12.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Моторный отсек DeLorean DMC-12. Фотография автомобиля в Эберманштадте.",
      "credit": "Reinhold Möller",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:DeLorean_DMC-12_Ebermannstadt_1250050.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "concorde": [
    {
      "caption": "Сверхзвуковой Concorde заходит на посадку в аэропорту Бен-Гурион.",
      "credit": "Yosi Aloni / Dan Hadani collection / National Library of Israel / The Pritzker Family National Photography Collection",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:The_Concord,_the_supersonic_airliner_landing_in_Ben_Gurion_Airport_(FL45747240).jpg",
      "width": 960,
      "height": 551
    },
    {
      "caption": "Салон музейного Concorde G-BBDG. На передней стенке расположены указатели скорости и высоты.",
      "credit": "Jules Verne Times Two",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Concorde_(G-BBDG)_cabin_showing_the_speed_and_altitude_display,_Brooklands_Museum,_Surrey,_UK_julesvernex2.jpg",
      "width": 960,
      "height": 624
    }
  ],
  "segway": [
    {
      "caption": "Двухколёсный персональный транспортёр Segway PT.",
      "credit": "Richard from DC, US",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Segway_PT_(2006).jpg",
      "width": 936,
      "height": 660
    },
    {
      "caption": "Экскурсия на Segway на набережной Нового Орлеана.",
      "credit": "Tony Webster",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:New_Orleans_Riverwalk_Segway_Tour.jpg",
      "width": 960,
      "height": 640
    }
  ],
  "glass": [
    {
      "caption": "Устройство Google Glass, вид спереди.",
      "credit": "Tim.Reckmann",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Google_Glass_Front.jpg",
      "width": 960,
      "height": 640
    },
    {
      "caption": "Оптический модуль Google Glass крупным планом.",
      "credit": "Antonio Zugaldia",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Google_Glass_detail.jpg",
      "width": 872,
      "height": 699
    }
  ],
  "newton": [
    {
      "caption": "Apple Newton MessagePad образца 1993 года в Computer History Museum.",
      "credit": "Michael Hicks from Saint Paul, MN, USA",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Apple_Newton_MessagePad_(1993)_-_Computer_History_Museum.jpg",
      "width": 960,
      "height": 800
    },
    {
      "caption": "Более поздняя модель MessagePad 2100 со стилусом.",
      "credit": "Alex Pappajohn",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:MessagePad_2100_(211946982).jpg",
      "width": 960,
      "height": 720
    }
  ],
  "zune": [
    {
      "caption": "Портативный музыкальный плеер Microsoft Zune в коричневом корпусе.",
      "credit": "Travis Hornung",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Zune-brown.jpg",
      "width": 825,
      "height": 1100
    },
    {
      "caption": "Следующее поколение устройств линейки, Zune HD.",
      "credit": "Deggle",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Zune_HD.jpg",
      "width": 960,
      "height": 637
    }
  ],
  "betamax": [
    {
      "caption": "Домашний видеомагнитофон Sony Betamax SL-C7E.",
      "credit": "Sabung.hamster aka Everyone Sinks Starco aka BxHxTxCx",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Sony_Betamax_SL-C7E.jpg",
      "width": 960,
      "height": 620
    },
    {
      "caption": "Кассета Betamax со снятой крышкой.",
      "credit": "© Raimond Spekking / CC BY-SA 4.0 (via Wikimedia Commons)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Betamax_tape_-_case_opened-4834.jpg",
      "width": 960,
      "height": 615
    }
  ],
  "blackberry": [
    {
      "caption": "BlackBerry Bold 9900 на зарядной подставке.",
      "credit": "P2u111",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:BlackBerry_Bold_9900_on_its_Charging_Pod.jpg",
      "width": 806,
      "height": 1100
    },
    {
      "caption": "Клавиатура и экран смартфона BlackBerry Bold 9700.",
      "credit": "WrS.tm.pl",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Blackberry_Bold_9700.jpg",
      "width": 960,
      "height": 521
    }
  ],
  "touchpad": [
    {
      "caption": "Джон Рубинштейн представляет HP TouchPad в феврале 2011 года.",
      "credit": "Robert Scoble, HP user interface",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Jon-rubenstein-hp-touchpad-2011-02-09.jpg",
      "width": 960,
      "height": 640
    },
    {
      "caption": "Планшет HP TouchPad в руках пользователя.",
      "credit": "Ben Miller",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:HP_TouchPad_hand.jpg",
      "width": 960,
      "height": 640
    }
  ],
  "firephone": [
    {
      "caption": "Смартфон Amazon Fire Phone на презентации устройства.",
      "credit": "Chris F",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Amazon_3D_Fire_Smartphone-2_(14507506603).jpg",
      "width": 960,
      "height": 484
    },
    {
      "caption": "Комплект Amazon Fire Phone после распаковки.",
      "credit": "Romazur",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Unboxed_amazon_fire_phone_32gb.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "virtualboy": [
    {
      "caption": "Настольная игровая система Nintendo Virtual Boy с контроллером.",
      "credit": "Evan-Amos",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Virtual-Boy-Set.jpg",
      "width": 866,
      "height": 1100
    },
    {
      "caption": "Светодиодный модуль дисплея Virtual Boy.",
      "credit": "Evan-Amos",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Nintendo-Virtual-Boy-Eye-LEDs.jpg",
      "width": 960,
      "height": 602
    }
  ],
  "stadia": [
    {
      "caption": "Игровой контроллер сервиса Google Stadia.",
      "credit": "Simon Waldherr",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Stadia_Controller_(52656461747).jpg",
      "width": 960,
      "height": 638
    },
    {
      "caption": "Плата контроллера Google Stadia после разборки.",
      "credit": "ubahnverleih",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Google_Stadia_Controller_(Mainboard).jpg",
      "width": 960,
      "height": 720
    }
  ],
  "dreamcast": [
    {
      "caption": "Домашняя приставка Sega Dreamcast.",
      "credit": "Evan-Amos",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Sega-Dreamcast-Console-FL.jpg",
      "width": 960,
      "height": 705
    },
    {
      "caption": "Контроллер Dreamcast с модулем памяти Visual Memory Unit.",
      "credit": "Evan-Amos",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Sega-Dreamcast-Controller-wVMU-FL.jpg",
      "width": 960,
      "height": 997
    }
  ],
  "a380": [
    {
      "caption": "Один из кадров первого полёта Airbus A380 в Тулузе.",
      "credit": "AlNo (discuter/talk/hablar/falar)",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/",
      "source": "https://commons.wikimedia.org/wiki/File:A380_f)_1st_flight.JPG",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Сборочное предприятие Airbus в Тулузе.",
      "credit": "Nicolas Halftermeyer",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Airbus_plane_factory_in_Toulouse,_France.JPG",
      "width": 960,
      "height": 540
    }
  ],
  "saab": [
    {
      "caption": "Saab 9-5 второго поколения в Познани в 2011 году.",
      "credit": "Peżot",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Saab_9-5_II_front_Poznan_2011.jpg",
      "width": 960,
      "height": 713
    },
    {
      "caption": "Автомобили в коллекции Saab Car Museum в Тролльхеттане.",
      "credit": "Lukasz19930915",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Saab_Car_Museum_-_cars.JPG",
      "width": 960,
      "height": 720
    }
  ],
  "panam": [
    {
      "caption": "Boeing 747 авиакомпании Pan Am в 1976 году.",
      "credit": "Project Kei",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Boeing_747_Pan_Am_1976.jpg",
      "width": 960,
      "height": 837
    },
    {
      "caption": "Терминал Pan Am Worldport в Нью-Йорке.",
      "credit": "Gottscho-Schleisner, Inc., photographer..",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Pan_Am_Worldport.jpg",
      "width": 375,
      "height": 161
    }
  ],
  "blockbuster": [
    {
      "caption": "Магазин Blockbuster в Бенде, штат Орегон.",
      "credit": "UpdateNerd",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:The_Last_Blockbuster_storefront.jpg",
      "width": 960,
      "height": 634
    },
    {
      "caption": "Торговый зал магазина в Бенде с полками фильмов напрокат.",
      "credit": "Coasterlover1994",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Interior_of_last_Blockbuster_Video.jpg",
      "width": 960,
      "height": 467
    }
  ]
,
  "mogilko-book": [
    {
      "caption": "Марина Могилко в книжном магазине The Last Bookstore.",
      "credit": "Александра Георгиевна Гененфельд",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Marina_Mogilko_in_The_Last_Bookstore.jpg",
      "width": 832,
      "height": 1040
    },
    {
      "caption": "Марина Могилко в студии YouTube Space в Сан-Франциско.",
      "credit": "Олег Шевчишин",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Marina_Mogilko_in_YouTube_Space,_San_Francisco.jpg",
      "width": 832,
      "height": 1040
    }
  ],
  "think-monk": [
    {
      "caption": "Джей Шетти, автор книги и ведущий подкаста On Purpose.",
      "credit": "Steven Erle",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Jay_Shetty_Headshot_2021.jpg",
      "width": 745,
      "height": 1040
    },
    {
      "caption": "Белый дом, июль 2023 года. Запись Джо Байдена в гостевой книге Джея Шетти.",
      "credit": "The White House",
      "license": "Public domain",
      "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
      "source": "https://commons.wikimedia.org/wiki/File:Joe_Biden_signs_a_guest_book_for_Jay_Shetty_(53235059234).jpg",
      "width": 960,
      "height": 640
    }
  ],
  "grebenuk-sales": [
    {
      "caption": "Руководитель отдела дизайна и продаж Рейчел Селлман обучает сотрудников Houston Homes. Снимок к теме обучения продавцов.",
      "credit": "Houstonhomesmo",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Sales_Training_at_Houston_Homes.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Книжная торговля на Texas Teen Book Festival в 2018 году. Снимок к теме работы с покупателем.",
      "credit": "Larry D. Moore",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Book_Sales_2018_Texas_Teen_Book_Festival.jpg",
      "width": 960,
      "height": 640
    }
  ],
  "hartmann-action": [
    {
      "caption": "Предприниматель Оскар Хартманн, автор книги.",
      "credit": "Darinelly",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Oskar_Hartmann.jpg",
      "width": 819,
      "height": 1040
    },
    {
      "caption": "Стартовые колодки на дорожке в Норман-Парке. Снимок к теме подготовки к старту.",
      "credit": "Norman Park athletics track: starting blocks by Stephen Craven",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Norman_Park_athletics_track,_starting_blocks_-_geograph.org.uk_-_2168170.jpg",
      "width": 640,
      "height": 480
    }
  ],
  "mom-test": [
    {
      "caption": "Антрополог Вольфганг Краус и его помощник проводят полевое интервью на рынке в Тингире, Марокко, в 2016 году.",
      "credit": "Man77",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Kraus_interview_Souq.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Исследователь Садик беседует с участником проекта Wikimedia о языковом разнообразии. Снимок к теме интервью.",
      "credit": "Shahadusadik",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Sadik_interviews_research_participant.jpg",
      "width": 744,
      "height": 992
    }
  ],
  "designing-life": [
    {
      "caption": "Школа дизайна Стэнфордского университета во время церемонии открытия.",
      "credit": "Steve Jurvetson",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:D.school_Stanford.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Доска с идеями на практикуме по дизайн-мышлению Wikimedia Deutschland.",
      "credit": "Corinna Schuster (WMDE)",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Design_Thinking_Workshop_WMDE_1.jpg",
      "width": 960,
      "height": 589
    }
  ],
  "linguatrip": [
    {
      "caption": "Марина Могилко и физик Джон Мартинис на Всемирном экономическом форуме в Давосе в 2026 году.",
      "credit": "Babbieshannon",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Marina_Mogilko_with_John_Martinis_at_World_Economic_Forum_in_Davos,_2026.jpg",
      "width": 596,
      "height": 1040
    },
    {
      "caption": "Занятие в школе Баочжун на Тайване. Снимок к теме языкового обучения.",
      "credit": "褒忠國中 雲端網",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "source": "https://commons.wikimedia.org/wiki/File:Classroom_with_students_in_Baozhong_Junior_High_School_20130308.jpg",
      "width": 960,
      "height": 643
    }
  ],
  "youdo": [
    {
      "caption": "Курьер на улице Вавилова в Москве, август 2025 года. Снимок к теме городских услуг.",
      "credit": "Retired electrician",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Moscow,_Vavilova_Street,_Yandex.Eda_courier,_Aug_2025_01.jpg",
      "width": 698,
      "height": 1040
    },
    {
      "caption": "Веломеханик за работой в Кении. Ремонт велосипеда — пример задания с проверяемым результатом.",
      "credit": "NoahNairobi",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:The_Bicycle_Mechanic.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "clientocracy": [
    {
      "caption": "Пельмени на полке «ВкусВилла» на Зацепском Валу в Москве, март 2025 года.",
      "credit": "Retired electrician",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:Moscow,_Vkusvill_Zatsepsky_Val_Mar.2025_-_pelmeni_04.jpg",
      "width": 960,
      "height": 720
    },
    {
      "caption": "Торговый зал супермаркета на Сейшелах. Снимок к теме ассортимента и выбора продуктов.",
      "credit": "Seychelles News Agency",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Seychelles_supermarket.jpg",
      "width": 640,
      "height": 427
    }
  ]
,
  "igtv": [
    {
      "caption": "Здание на Джефферсон-драйв в Менло-Парке, где на момент съёмки размещалась штаб-квартира Instagram.",
      "credit": "Coolcaesar",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:200_Jefferson_Drive.jpg",
      "width": 960,
      "height": 640
    },
    {
      "caption": "Посетители снимают водопад Шифэнь на смартфон, Тайвань, август 2019 года.",
      "credit": "Yue gowua YT",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:People_recording_video_with_iPhone_at_Shifen_Waterfall_20190812.jpg",
      "width": 960,
      "height": 720
    }
  ],
  "linkedin-stories": [
    {
      "caption": "Штаб-квартира LinkedIn в Саннивейле, Калифорния.",
      "credit": "LPS.1",
      "license": "CC0",
      "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "source": "https://commons.wikimedia.org/wiki/File:LinkedIn_Headquarters_Sunnyvale.jpg",
      "width": 960,
      "height": 640
    },
    {
      "caption": "Участник рабочего семинара в Будапеште задаёт вопрос. Снимок к теме обмена профессиональным опытом.",
      "credit": "Sarah Stierch",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Alex_asks_a_question_at_the_Program_Evaluation_%26_Design_Workshop_in_Budapest_-_Sarah_Stierch.jpg",
      "width": 943,
      "height": 1040
    }
  ]
};
