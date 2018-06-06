/// === page ready事件開始,註冊事件統一寫於下面區間 ===

$(document).ready(function (): void {
    /// 強制 頁面一進來就將 focus 放在 input上面
    $("#JTISearchText").focus().on("keydown", function (event: JQueryEventObject): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            ClickSearchBtn();
        }
    });
    /// 1.註冊 search button click event
    $("#JTISearchBtn").on("click", function (): void {
        ClickSearchBtn();
    });
    /// 2.註冊待選區 hash tag click event，點擊後繪製已選區UI
    $(".JTIHashTag").on("click", ".htbtn", function (event: JQueryEventObject): void {
        DisplaySelectedHashTagUI(event);
    });
    /// 3.註冊已選取 hash tag delete button event
    $(".SearchHashTag").on("click", ":button.selected_hashtag", function (event: JQueryEventObject): void {
        RemoveSingleSelectedHashTagUI(event);
    });
    /// 4.註冊清除按鈕的 click event
    $("#JTIClearBtn").on("click", function (): void {
        RemoveAllSelectedHashTagUI();
    });

    let inDesignMode: string = document.forms[MSOWebPartPageFormName].MSOLayout_InDesignMode.value;
    /// wikipageinDesignMode
    let wikiInEditMode: string = document.forms[MSOWebPartPageFormName]._wikiPageMode.value;
    if ($(".JTIHashTag").length > 0 && (inDesignMode !== "1" && wikiInEditMode !== "Edit")) {
        /// 5.撈取 所有的hash tags並繪製UI
        getTermSet();
    }
    /// 註冊hash tag選單開關按鈕
    $("#JTIOpenBtn").on("click", function (): void {
        SetHashTagMenuToggle();
    });
});
/// === page ready事件結束,註冊事件統一寫於上面區間 ===

class TermClass implements ITermType {
    public Guid: string;
    public Name: string;
    public ParentGuid: string;
    public IsRoot: boolean;
    public CustomSortOrder: string;
    public SortNo: number;
    public Children: Array<TermClass>;
    constructor() {
        this.Guid = "";
        this.Name = "";
        this.ParentGuid = "";
        this.IsRoot = true;
        this.CustomSortOrder = "";
        this.SortNo = 0;
        this.Children = new Array<TermClass>();
    }
}

/// <summary>
/// 取得字詞組資料
/// </summary>
function getTermSet(): void {
    SP.ClientContext.get_current();
    SP.SOD.loadMultiple(['sp.js'], function (): void {
        // Make sure taxonomy library is registered
        SP.SOD.registerSod('sp.taxonomy.js', SP.Utilities.Utility.getLayoutsPageUrl('sp.taxonomy.js'));
        SP.SOD.loadMultiple(['sp.taxonomy.js'], function (): void {
            let context: SP.ClientContext = SP.ClientContext.get_current();
            let taxSession: SP.Taxonomy.TaxonomySession = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);
            let termStore: SP.Taxonomy.TermStore = taxSession.getDefaultSiteCollectionTermStore();
            /// 2018.05.02 PM 要求修改成GUID 撈取

            //let termSetName: string = "SKS Hashtags";
            //let locale: number = 1033; // LCID of the language. Here is English
            //let termSets: SP.Taxonomy.TermSetCollection = termStore.getTermSetsByName(termSetName, 1033);
            //let termSet: SP.Taxonomy.TermSet = termSets.getByName(termSetName);
            let termSet = termStore.getTermSet(new SP.Guid('1e0b21dc-67d5-4fed-a538-92e38d1cbd87'));

            let terms: SP.Taxonomy.TermCollection = termSet.getAllTerms();
            context.load(terms, 'Include(IsRoot, Labels, TermsCount, CustomSortOrder, Id, IsAvailableForTagging, Name, PathOfTerm, Parent, Parent.Id, TermSet.Name)');
            context.load(termSet);
            let tempTermArr: Array<TermClass> = new Array<TermClass>();
            let termArr: Array<TermClass> = new Array<TermClass>();
            context.executeQueryAsync(function (): void {
                let rootCount: number = 0;
                $.each(terms.get_data(), function (index: number, dataItem: any): void {
                    let tempTerm: TermClass = new TermClass();
                    tempTerm.Guid = dataItem.get_id()._m_guidString$p$0;
                    tempTerm.Name = dataItem.get_name();
                    tempTerm.IsRoot = dataItem.get_isRoot();
                    tempTerm.CustomSortOrder = dataItem.get_customSortOrder();
                    if (tempTerm.IsRoot) {
                        tempTerm.ParentGuid = "";
                        tempTerm.SortNo = rootCount;
                        rootCount++;
                    } else {
                        tempTerm.ParentGuid = dataItem.get_parent().get_id()._m_guidString$p$0;
                    }
                    tempTermArr.push(tempTerm);
                });
                SortArrByColumnName(tempTermArr, "ParentGuid");
                while (tempTermArr.length > 0) {
                    if (tempTermArr[0].IsRoot) {
                        termArr.push(tempTermArr[0]);
                        tempTermArr.splice(0, 1);
                    } else {
                        let tempArrLength: number = tempTermArr.length;
                        InsertTermTreeNode(termArr, tempTermArr[0], tempTermArr);
                        if (tempArrLength === tempTermArr.length) {
                            tempTermArr.push(tempTermArr[0]);
                            tempTermArr.splice(0, 1);
                        }
                    }
                }
                SortArrByColumnName(termArr, "SortNo");
                DisplayAllHashTagUI(termArr);
            });
        });
    });
}

/// <summary>
/// 將字詞組資料插入至tree 的節點
/// </summary>
/// <param name="dataArr">資料Tree </param>
/// <param name="checkItem">要插入的資料</param>
function InsertTermTreeNode(dataArr: Array<TermClass>, checkItem: TermClass, tempTermArr: Array<TermClass>): void {
    $.each(dataArr, function (index: number, dataItem: TermClass): void {
        if (dataItem.Guid === checkItem.ParentGuid) {
            if (dataItem.CustomSortOrder !== null) {
                let tempCustomSortOrderArr: Array<string> = dataItem.CustomSortOrder.split(':');
                checkItem.SortNo = tempCustomSortOrderArr.indexOf(checkItem.Guid);
            }
            dataItem.Children.push(checkItem);
            tempTermArr.splice(0, 1);
        } else {
            InsertTermTreeNode(dataItem.Children, checkItem, tempTermArr);
        }
    });
}

/// <summary>
/// 繪製全部的字詞組(等待選擇區)
/// </summary>
/// <param name="dataArr">資料Tree </param>
function DisplayAllHashTagUI(dataArr: Array<TermClass>): void {
    /// 6.判斷第一次搜尋還是已經搜尋過了，來讓menu 預設是開還是關
    /// ?k= or #k=  window.location.search;
    let _currentUrl: string = decodeURIComponent(document.URL);
    let checkSearchFlag: boolean = false;
    if (_currentUrl.indexOf("?k=") === -1 && _currentUrl.indexOf("#k=") === -1) {
        SetHashTagMenuToggle();
    } else {
        $(".JTISearchResultWP").removeClass("ms-hide");
        checkSearchFlag = true;
    }
    $(".JTIHashTag").empty();
    let promiseArr: Array<any> = new Array<any>();
    $.each(dataArr, function (index: number, dataItem: TermClass): void {
        let htmlStr: string = "<div class='srch-tagtree'><div class='srch-tagtree__root'>" + dataItem.Name + "</div>";
        if (dataItem.Children.length > 0) {
            htmlStr += "<div class='srch-tagtree__branch'>";
            $.each(dataItem.Children, function (childIndex: number, childItem: TermClass): void {
                if (childItem.Children.length > 0) {
                    htmlStr += "<div class='btn-group'><button type='button' class='srch-tagtree__tag htbtn' id='ht-" + childItem.Guid + "'>"
                        + childItem.Name + "</button><button aria-expanded='false' aria-haspopup='true' class='srch-tagtree__tag dropdown-toggle dropdown-toggle-split' data-toggle='dropdown' type='button'><span class='sr-only'>Toggle Dropdown</span></button><div class='dropdown-menu'>";
                    $.each(childItem.Children, function (grandsonIndex: number, grandsonItem: TermClass): void {
                        htmlStr += "<a class='dropdown-item htbtn' href='javascript:void(0)'id='ht-" + grandsonItem.Guid + "'>" + grandsonItem.Name + "</a>";
                    });
                    htmlStr += "</div></div>";
                } else {
                    htmlStr += "<button id='ht-" + childItem.Guid + "' class='srch-tagtree__tag htbtn' type='button'>" + childItem.Name + "</button>";
                }
            });
            htmlStr += "</div>";
        }
        htmlStr += "</div>";
        $(".JTIHashTag").append(htmlStr);
    });
    SetHashTagMenuAnimation();
    /// 如果有查詢，要把條件重新繪製出來
    if (checkSearchFlag) {
        SetSearchGetValue();
    }
}

/// <summary>
/// 送出查詢
/// </summary>
function ClickSearchBtn(): void {
    let currentUrl: string = document.URL.substring(0, document.URL.indexOf(".aspx") + 5);
    let urlArr: Array<string> = new Array<string>();
    /// input text search value
    let textSearchStr: string = "";
    if ($("#JTISearchText").val() !== "") {
        textSearchStr = $("#JTISearchText").val();
        urlArr.push(textSearchStr);
    }
    let hashTagSearchStr: string = "";
    /// 取得所有有選取的hash tags
    let selectHashTags: NodeListOf<Element> = document.querySelectorAll(".selected_hashtag");
    if (selectHashTags.length > 0) {
        hashTagSearchStr = "myJTITag:(";
        $.each(selectHashTags, function (index: number, selectItem: HTMLElement): void {
            /// 取得 data-id
            let tempId: string = $(selectItem).attr("id").substring(4);
            if (index === 0) {
                hashTagSearchStr += tempId;
            } else {
                hashTagSearchStr += " OR " + tempId;
            }
        });
        hashTagSearchStr += ")";
        urlArr.push(hashTagSearchStr);
    }
    if (urlArr.length > 0) {
        let tempSearchUrlStr: string = "";
        $.each(urlArr, function (key: number, urlItem: string): void {
            if (key === 0) {
                tempSearchUrlStr += urlItem;
            } else {
                tempSearchUrlStr += " AND " + urlItem;
            }
        });
        window.location.replace(currentUrl + "?k=" + encodeURIComponent(tempSearchUrlStr));
    }
    /// 根據input 文字和hash tag 按鈕組合 search url 然後將網址轉頁至 ?K=(組合文字)
}

/// <summary>
/// 繪製選擇區的
/// </summary>
/// <param name="event">點擊事件物件</param>
function DisplaySelectedHashTagUI(event: JQueryEventObject): void {
    if ($(":button.selected_hashtag").length < 40) {
        let _element: JQuery = $(event.target);
        /// 2.1 先判斷是否已經選取，如果還沒選取，執行下面動作
        if (event.target.tagName === "BUTTON" && !_element.hasClass("srch-tagtree__tag--selected")) {
            /// 2.2 按鈕變色
            _element.addClass("srch-tagtree__tag--selected");
            /// 2.3 將東西推進 search hash tag zone
            let htmlStr: string = "<button class='srch-form__tag selected_hashtag' id='s" + _element.attr("id") + "' type='button'>"
                + _element.text() + "<span class='far fa-times'></span></button>";
            $(".SearchHashTag").append(htmlStr);
        }
        if (event.target.tagName === "A" && !_element.hasClass("selected")) {
            /// 2.2 按鈕變色
            _element.addClass("selected");
            /// 下拉按鈕
            let _uncleElement: JQuery = _element.parent("div.dropdown-menu").prev(":button.dropdown-toggle.dropdown-toggle-split");
            if (!_uncleElement.hasClass("srch-tagtree__tag--selected")) {
                _uncleElement.addClass("srch-tagtree__tag--selected");
            }
            /// 上一層的文字
            let _bigUncleText: string = _uncleElement.prev(":button.htbtn").text();
            /// 2.3 將東西推進 search hash tag zone
            let htmlStr: string = "<button class='srch-form__tag selected_hashtag' id='s" + _element.attr("id") + "' type='button'>"
                + _bigUncleText + "-" + _element.text() + "<span class='far fa-times'></span></button>";
            $(".SearchHashTag").append(htmlStr);
        }
        /// 要不要顯示 No selected tags
        SetNoSelectTagSpanToggle();
    } else {
        alert("The selected tag can not exceed 40.");
    }
}

/// <summary>
/// 清除已選擇區的所有按鈕
/// </summary>
function RemoveAllSelectedHashTagUI(): void {
    /// 清空已選區
    $(".SearchHashTag").empty();
    /// 清除待選區已選擇 class
    $(".JTIHashTag :button.srch-tagtree__tag--selected").removeClass("srch-tagtree__tag--selected");
    /// 清除待選區第三層已選擇 class
    $(".JTIHashTag .dropdown-menu a.selected").removeClass("selected");
    /// 要不要顯示 No selected tags
    SetNoSelectTagSpanToggle();
}

/// <summary>
/// 清除已選擇區的單一個按鈕
/// </summary>
/// <param name="event">點擊事件物件</param>
function RemoveSingleSelectedHashTagUI(event: JQueryEventObject): void {
    let _clickElement: JQuery = $(event.target);
    /// 3.1 DIV 砍掉
    let tempId: string = _clickElement.attr("id");
    $(".SearchHashTag #" + tempId).remove("#" + tempId);
    /// 3.2 將顏色拿掉
    let _removeElement: JQuery = $(".JTIHashTag #" + tempId.substring(1));
    if (_removeElement.get(0).tagName === "BUTTON") {
        _removeElement.removeClass("srch-tagtree__tag--selected");
    }
    if (_removeElement.get(0).tagName === "A") {
        _removeElement.removeClass("selected");
        if (_removeElement.parent().children(".selected").length < 1) {
            _removeElement.parent().prev(":button.srch-tagtree__tag").removeClass("srch-tagtree__tag--selected");
        }
    }
    /// 要不要顯示 No selected tags
    SetNoSelectTagSpanToggle();
}

/// <summary>
/// 根據陣列裡物件的排序號碼(SortNo)，來排序陣列
/// </summary>
/// <param name="dataArr">要排序的陣列物件</param>
function SortArrByColumnName(dataArr: Array<TermClass>, columnName: string): void {
    if (typeof (dataArr) !== "undefined" && dataArr !== null && dataArr.length > 0) {
        dataArr.sort(function (a: any, b: any): number {

            if (a[columnName] > b[columnName]) {
                return 1;
            } else if (a[columnName] < b[columnName]) {
                return -1;
            } else {
                return 0;
            }
        });
        $.each(dataArr, (index: number, e: any): void => {
            if (typeof (e.Children) !== "undefined" && e.Children !== null) {
                this.SortArrByColumnName(e.Children, columnName);
            }
        });
    }
}

/// <summary>
/// 設定搜尋送出後的畫面，將USER 搜尋的東西畫回UI上
/// </summary>
function SetSearchGetValue(): void {
    let tempSearchStr: string = decodeURIComponent(window.location.search);
    let searchText: string = "";
    /// 判斷有沒有搜尋 hash tag
    if (tempSearchStr.indexOf("myJTITag") > -1) {
        let tempSearchGuidArr: Array<string> = new Array<string>();
        tempSearchGuidArr = tempSearchStr.match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g);
        $.each(tempSearchGuidArr, function (index: number, dataItem: string): void {
            $("#ht-" + dataItem).trigger("click");
        });

        /// serach 的文字
        if (tempSearchStr.indexOf("myJTITag") > 3) {
            searchText = tempSearchStr.substring(tempSearchStr.indexOf("?k=") + 3, tempSearchStr.indexOf(" AND myJTITag"));
        }
    } else {
        searchText = tempSearchStr.substring(tempSearchStr.indexOf("?k=") + 3);
    }
    $("#JTISearchText").val(searchText);
}

/// <summary>
///  設定MENU 按鈕開關
/// </summary>
function SetHashTagMenuToggle(): void {
    $(".srch-form__btn-adv").toggleClass("srch-form__btn-adv--open");
    $(".srch-adv").toggleClass("srch-adv--open");
}

/// <summary>
///  設定MENU 按鈕的動畫
/// </summary>
function SetHashTagMenuAnimation(): void {
    let sr: scrollReveal.ScrollRevealObject = ScrollReveal();
    sr.reveal(
        '.srch-tagtree__tag',
        {
            duration: 700
        },
        50);
}

/// <summary>
///  設定要不要顯示 No selected tags 提示
/// </summary>
function SetNoSelectTagSpanToggle(): void {
    if ($(":button.selected_hashtag").length > 0) {
        if (!$("span.srch-form__hint").hasClass("d-none")) {
            $("span.srch-form__hint").addClass("d-none");
        }
    } else {
        if ($("span.srch-form__hint").hasClass("d-none")) {
            $("span.srch-form__hint").removeClass("d-none");
        }
    }
}