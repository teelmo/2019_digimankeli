import React, { useEffect, useState, useCallback } from 'react';
import '../styles/styles.less';

import $ from 'jquery';

let plus;

function App() {
  const [data, setData] = useState([]);
  const [done, setDone] = useState(false);
  const [facebookLink, setFacebookLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');

  const shuffle = (o) => {
    for (let j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };

  const getScale = () => {
    const width = $(plus).width();
    if (width >= 578) {
      $(plus).addClass('wide');
      return true;
    }
    $(plus).removeClass('wide');
    return false;
  };

  const getDataPath = () => {
    if (window.location.href.includes('github')) return './assets';
    if (process.env.NODE_ENV === 'production') return 'https://lusi-dataviz.ylestatic.fi/2019_digimankeli/assets';
    return 'assets';
  };

  const initMediaUrls = useCallback(() => {
    $.each($('.handle_img', plus), (i, el) => {
      $(el).attr('src', `${getDataPath()}/img/${$(el).attr('data-src')}`);
    });
  }, []);

  const updateSomeLinks = useCallback((correct_count) => {
    const url = window.location.href;

    // Facebook share.
    setFacebookLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://share.api.yle.fi/share/digimankeli/${data.results[correct_count].id}.html?url=artikkeli/2019/03/15/pista-digisanamankeli-pyorimaan-ja-testaa-tietosi`)}`);

    // Twitter share.
    setTwitterLink(`https://twitter.com/share?url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent('digisanatesti,yle')}&text=${encodeURIComponent('Tein digisanastotestin ja olen tasoltani Atkvelho. Testaa, mikä sinä olet!')}`);

    $('.share_container', plus).slideDown();
  }, [data.results]);

  const countCorrect = () => {
    let correct_count = 0;
    for (let i = 0; i < $('.question h3', plus).length; i++) {
      const selected = $(`input[name="q_${i}"]:checked`, plus);

      selected.parent('.answer').find('.incorrect').fadeIn(500);
      correct_count = (selected.val() === 'true') ? correct_count + 1 : correct_count;
    }
    return correct_count;
  };

  const checkReady = () => {
    let all_answered = true;
    $.each($('.required', plus), (key, answer) => {
      if ($(`input[name=${answer.name}]:checked`, plus).length === 0) {
        all_answered = false;
      }
    });
    return all_answered;
  };

  const checkReadyHelper = useCallback(() => {
    if (done === false) {
      const answer_input = [];
      for (let i = 1; i <= $('.question h3', plus).length; i++) {
        const selected = $(`input[name="q_${i}"]:checked`, plus);
        if (selected.length !== 0) {
          answer_input.push(selected.attr('data-input-value'));
        }
      }
      const correct_count = countCorrect();
      updateSomeLinks(correct_count);
      $('.result', plus).html(`<h1>Sait ${correct_count}/8 oikein. Olet ${data.results[correct_count].title}</h1><p> ${data.results[correct_count].text}</p><p><img src="${getDataPath()}/img/${data.results[correct_count].img}" alt="Tuloskuva" /></p>`);
      $('.result_container', plus).show();

      // Disable inputs.
      $('input', plus).attr('disabled', 'disabled');
      $('label', plus).addClass('disabled');
      setDone(true);
    }
  }, [data.results, done, updateSomeLinks]);

  const initEvents = useCallback(() => {
    $(window).resize(() => {
      getScale();
    });
    plus.on('change', '.question input', (event) => {
      // Store label element.
      const label = $(event.currentTarget).parent('label');
      label.addClass('selected disabled');
      // Disable inputs.
      $(`input[name="${$(event.currentTarget).attr('name')}"]`, plus).attr('disabled', 'disabled');
      label.parent('.answer').parent('.question').find('label').addClass('disabled');

      // Show indicator.
      if ($(event.currentTarget).val() === 'true') {
        $($(event.currentTarget).attr('data-desc'), plus).find('.correct').show();
      } else {
        $($(event.currentTarget).attr('data-desc'), plus).find('.incorrect').show();
      }
      // Show description.
      $($(event.currentTarget).attr('data-desc'), plus).slideDown();

      // Check all questions have been answered.
      if (checkReady()) {
        checkReadyHelper();
      }
    });
  }, [checkReadyHelper]);

  useEffect(() => {
    const selectedQuestions = [];
    const questions_cont = $('.questions', plus).empty();
    if (data.questions) {
      $.each(shuffle(data.questions), (i, q) => {
        if (i >= 8) {
          return false;
        }
        // Question container.
        const question_cont = $('<div class="question"></div>').appendTo(questions_cont);
        // Question header.
        $(`<h3>${i + 1}/8 – ${q.title}</h3>`).appendTo(question_cont);
        selectedQuestions.push(q.title);
        // Question description.
        if (q.question_desc) {
          $(`<p>${q.question_desc}</p>`).appendTo(question_cont);
        }
        // Question img.
        if (q.img) {
          $(`<img src="${q.img}" class="question_img" alt="" />`).appendTo(question_cont);
        }
        // Choices.
        const choises = $(`<div class="choises_container choises_container_${i}"></div>`).appendTo(question_cont);
        $.each(shuffle(q.choises), (j, c) => {
          $(`<div class="choise_container"><label class="text_answer" data-container="choises_container_${i}"><input type="radio" value="${c.is_true}" data-input-id="${j}" data-input-value="${c.title}" class="required" name="q_${i}" data-desc=".desc_${i}"/><span class="label">${c.title}</span></label></div>`).appendTo(choises);
        });
        // Answer description.
        if (q.answer_desc !== '' && q.answer_desc !== '<p></p>') {
          const answer_desc_cont = $(`<div class="desc desc_${i} hidden">${q.feedback}<p>${q.answer_desc}</p></div>`).appendTo(question_cont);
          if (q.link) {
            $(`<div class="link"><p>Lue lisää: <a href="${q.link.url}" target="_blank">${q.link.text}</a></p></div>`).appendTo(answer_desc_cont);
          }
        }
        // Question footer.
        if (q.footer) {
          $(q.footer).appendTo(question_cont);
        }
        return true;
      });
      initMediaUrls();
      initEvents();
    }
  }, [data.questions, initMediaUrls, initEvents]);

  const shareButton = (event) => {
    const specs = `top=${(window.screen.height / 2) - (420 / 2)},left=${(window.screen.width / 2) - (550 / 2)},toolbar=0,status=0,width=550,height=420`;
    window.open(event.currentTarget.href, 'Jaa', specs);
    event.preventDefault();
  };

  useEffect(() => {
    plus = $('#app-root-2019_digimankeli');
  }, []);

  useEffect(() => {
    fetch(`${getDataPath()}/data/2019_digimankeli_data.json`).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.text();
    }).then(body => {
      body = JSON.parse(body);
      setData(body);
    });
  }, []);

  return (
    <div className="app">
      <div className="questions">Ladataan...</div>
      <div className="result_container">
        <div className="result" />
        <div className="share_container hidden">
          Jaa tuloksesi
          {' '}
          <a href={twitterLink} target="_blank" onClick={(event) => shareButton(event)} rel="noreferrer">Twitterissä</a>
          {' '}
          ja
          {' '}
          <a href={facebookLink} target="_blank" onClick={(event) => shareButton(event)} rel="noreferrer">Facebookissa</a>
          .
        </div>
      </div>
    </div>
  );
}
export default App;
